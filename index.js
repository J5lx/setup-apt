const core = require('@actions/core');
const exec = require('@actions/exec');


// https://github.com/travis-ci/travis-build/blob/master/lib/travis/build/addons/apt.rb
async function run() {
  try {
    const sources = core.getInput('sources').split(" ");
    const packages = core.getInput('packages').split(" ");
    const update = core.getInput('update');

    if (process.platform !== "linux") {
      core.debug("Not on Linux, skipping APT setup");
      return;
    }

    if (!packages[0].length) {
      core.debug("Nothing to do");
      return;
    }

    if (sources[0].length) {
      core.startGroup("Adding APT sources");
      for (const source of sources) {
        if (!source.startsWith("ppa:")) {
          throw new Error("Only PPAs are supported at the moment");
        }
        if (await exec.exec('sudo', ['apt-add-repository', '-y', source]) !== 0) {
          throw new Error("Unable to add source " + source);
        }
      }
      core.endGroup();
    }

    if (update) {
      core.startGroup("Fetching APT updates");
      if (await exec.exec('sudo', ['apt-get', 'update', '-yq'])) {
        throw new Error("Unable to update");
      }
      core.endGroup();
    }

    core.startGroup("Installing APT packages");
    // TODO: Caching
    // XXX: What about '--allow-downgrades', '--allow-remove-essential', '--allow-change-held-packages' ?
    if (await exec.exec('sudo', ['apt-get', '-yq', '--no-install-suggests', '--no-install-recommends', 'install'].concat(packages)) !== 0) {
      throw new Error("Unable to install packages");
    }
    core.endGroup();
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
