import { getSharedResource } from "./SharedResources.js";
import Logger from "./util/Logger.js";

let currentRuntimeVersionIndex;
let warnings = true;

/**
 * Object to be populated at build-time
 * @type {{patch: string, major: string, minor: string, buildTime: string, isNext: string, suffix: string, version: string}}
 */
const versionInfo = {
	version: "__VERSION__",
	major: "__MAJOR__",
	minor: "__MINOR__",
	patch: "__PATCH__",
	suffix: "__SUFFIX__",
	isNext: "__IS_NEXT__",
	buildTime: "__BUILD_TIME__",
};

/**
 * Central registry where all runtimes register themselves by pushing an object with info about their version.
 * The index in the registry servers as an ID for the runtime.
 * @type {*}
 */
const versionsRegistry = getSharedResource("Versions", []);

/**
 * Compares the versions of two runtimes to determine which one is newer
 *
 * @param ver1 Version info object 1
 * @param ver2 Version info object 2
 * @returns {number} positive number if ver1 is newer, 0 if equal, negative number if ver1 is older
 */
const compare = (ver1, ver2) => {
	// If major versions differ, bigger one wins
	const majorDiff = ver1.major - ver2.major;
	if (majorDiff) {
		return majorDiff;
	}

	// If minor versions differ, bigger one wins
	const minorDiff = ver1.minor - ver2.minor;
	if (minorDiff) {
		return minorDiff;
	}

	// If patch versions differ, bigger one wins
	const patchDiff = ver1.patch - ver2.patch;
	if (patchDiff) {
		return patchDiff;
	}

	// If any of the two is a next version, bigger buildTime wins
	if (ver1.isNext || ver2.isNext) {
		return ver1.buildTime - ver2.buildTime;
	}

	// If none of the two are next versions, bigger suffix wins, f.e. rc10 > rc9
	// Important: suffix is alphanumeric, must use natural compare
	const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
	return collator.compare(ver1.suffix, ver2.suffix);
};

/**
 * Returns the version info object for a given runtime (current runtime by default)
 *
 * @param versionIndex the ID of the runtime (current runtime if undefined)
 * @returns {*}
 */
const getVersionInfo = versionIndex => {
	versionIndex = versionIndex || currentRuntimeVersionIndex;
	return versionsRegistry[versionIndex];
};

/**
 * Registers the current runtime in the shared versions resource registry
 */
const registerVersionInfo = () => {
	if (currentRuntimeVersionIndex !== undefined) {
		throw new Error("Version already registered");
	}

	versionsRegistry.push({
		version: versionInfo.version,
		major: parseInt(versionInfo.major),
		minor: parseInt(versionInfo.minor),
		patch: parseInt(versionInfo.patch),
		suffix: versionInfo.suffix,
		buildTime: parseInt(versionInfo.buildTime),
	});
	currentRuntimeVersionIndex = versionsRegistry.length - 1;
};

/**
 * Returns the index of the current runtime's version info object in the shared versions resource registry
 * @returns {*}
 */
const getVersionIndex = () => {
	if (currentRuntimeVersionIndex === undefined) {
		throw new Error("Version not yet registered");
	}

	return currentRuntimeVersionIndex;
};

/**
 * Compares the current runtime's version with the version of another runtime on the same page (in the shared versions resource registry)
 * @param otherVersionIndex The index in the registry of the version to be compared with
 * @returns {number} Positive number if the current runtime's version is newer, 0 if equal, negative number if the current runtime's version is older
 */
const compareWithVersion = otherVersionIndex => {
	const otherVersionInfo = versionsRegistry[otherVersionIndex];
	return compare(getVersionInfo(), otherVersionInfo);
};

/**
 * Call this method to stop console warnings such as "Tags already registered by another version"
 */
const disableVersionWarnings = () => {
	warnings = false;
};

/**
 * Determines whether version-related warnings are enabled
 * @returns {boolean}
 */
const versionWarningsEnabled = () => {
	return warnings;
};

const logDisableVersionWarningsInstructions = logger => {
	if (!(logger instanceof Logger)) {
		throw new Error("logger must be a Logger class instance");
	}

	logger.para(`To suppress version related warnings such as this one, add the following code to your bundle:`);
	logger.line(`import { disableVersionWarnings } from "@ui5/webcomponents-base/dist/Version.js";`);
	logger.line(`disableVersionWarnings();`);
};

/**
 * Returns an array with strings, containing the versions of all registered runtimes
 * @returns {*}
 */
const getAllVersions = () => versionsRegistry.map(verInfo => verInfo.version);

export {
	getVersionInfo,
	registerVersionInfo,
	getVersionIndex,
	compareWithVersion,
	disableVersionWarnings,
	versionWarningsEnabled,
	getAllVersions,
	logDisableVersionWarningsInstructions,
};
