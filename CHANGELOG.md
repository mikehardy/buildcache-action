## [2.1.0](https://github.com/mikehardy/buildcache-action/compare/v2.0.0...v2.1.0) (2022-10-21)


### Features

* add config option to explicitly set the buildcache tag to use ([#105](https://github.com/mikehardy/buildcache-action/issues/105)) ([1db83fb](https://github.com/mikehardy/buildcache-action/commit/1db83fb06b0da378aa7db7a1110923b904417cbc))

## [2.0.0](https://github.com/mikehardy/buildcache-action/compare/v1.3.0...v2.0.0) (2022-10-12)


### ⚠ BREAKING CHANGES

* **deps:** use node16

### Bug Fixes

* **deps:** use node16 ([38afb35](https://github.com/mikehardy/buildcache-action/commit/38afb357c4bd1834789044c3259a6748c06ef891)), closes [#100](https://github.com/mikehardy/buildcache-action/issues/100)

# [1.3.0](https://github.com/mikehardy/buildcache-action/compare/v1.2.2...v1.3.0) (2022-06-26)


### Features

* avoid storing empty/no-change caches + add toggle to skip cache store ([8ddbf68](https://github.com/mikehardy/buildcache-action/commit/8ddbf681fc4e39327c7939600be3f3d7f0c676e8))

## [1.2.2](https://github.com/mikehardy/buildcache-action/compare/v1.2.1...v1.2.2) (2021-07-21)


### Bug Fixes

* consistently use path.join for joining paths ([7dc69af](https://github.com/mikehardy/buildcache-action/commit/7dc69af28e45a330d45204a54587dead618923da))
* Support relative paths for BUILDCACHE_DIR and BUILDCACHE_LOG_FILE ([bbc03f8](https://github.com/mikehardy/buildcache-action/commit/bbc03f80b4f90a7bebcb0eab4ab6a859f4e4f5ff)), closes [#35](https://github.com/mikehardy/buildcache-action/issues/35)
* unset BUILDCACHE_IMPERSONATE for stats-related runs ([0c876e7](https://github.com/mikehardy/buildcache-action/commit/0c876e72ba9b99872d4d5d7ee7d7def6e4449697)), closes [#31](https://github.com/mikehardy/buildcache-action/issues/31)
* use BUILDCACHE_DIR as root of log file also on restore ([ae162c6](https://github.com/mikehardy/buildcache-action/commit/ae162c61371c109cfc905c1d329cbdcf82590b6d))
* use unlink instead of rmRF for the log file ([19bd1cf](https://github.com/mikehardy/buildcache-action/commit/19bd1cfbda458bae1b5a9294b0cee888b4bd254e))

# CHANGELOG

## 1.2.1

- docs: a lot of work on documentation so the project is easy to understand and integrate

## 1.2.0

- feat: allow complete config control via environment variables defined/used by buildcache

## 1.1.1

- fix: all log from action prefixed with `buildcache: `
- docs: added example integration / stats from react-native-vision-camera
- chore: deprecate `key`, encourage use of less ambiguous `cache_key`
- test: lots of test improvements to verify behavior: check the repo actions logs if curious

## 1.1.0

- feat: add input param to zero stats before a run, defaults to true
- feat: upload buildcache.log in the action via parameter, defaults false

## 1.0.0

- initial release, hey, buildcache can work in yoru github action with no fuss
