###### Development notes

- Create patches for the github workflows that check and bump the version of the `setup-dotnet@v4` action
- Port `sed` patches to python patcher for better failure observability
- Consider any other patches/automations to keep patches compatible with upstream into the future
- Consider releasing versions based on version.json when upstream makes a release, rather than following all changes to upstream main with dated versions
- Consider relaxing linting exceptions in build process
- Add dry run to `replacer.py` and don't commit unless all patches pass
