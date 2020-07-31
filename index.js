const core = require('@actions/core');
const exec = require('@actions/exec');


// https://github.com/travis-ci/travis-build/blob/master/lib/travis/build/addons/apt.rb
async function run() {
  try {
    const sources = core.getInput('sources');
    const packages = core.getInput('packages');
    const update = core.getInput('update');

    if (process.version !== "linux") {
      core.debug("Not on Linux, skipping APT setup");
    }

    if (!packages.length) {
      core.debug("Nothing to do");
      return;
    }

    for (const source of sources) {
      if (!source.startsWith("ppa:")) {
        throw new Error("Only PPAs are supported at the moment");
      }
      core.info("Adding APT source " + source);
      if (await exec.exec('sudo', ['apt-add-repository', '-y', source]) !== 0) {
        throw new Error("Unable to add source " + source);
      }
    }

    if (update && await exec.exec('sudo', ['apt-get', 'update', '-yq'])) {
      throw new Error("Unable to update");
    }

    core.info("Installing APT packages");
    // TODO: Caching
    if (await exec.exec('sudo', ['apt-get', '-yq', '--no-install-suggests', '--no-install-recommends', '--allow-downgrades', '--allow-remove-essential', '--allow-change-held-packages', 'install'].concat(packages)) !== 0) {
      throw new Error("Unable to install packages");
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
