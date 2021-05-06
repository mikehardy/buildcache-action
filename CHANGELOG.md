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
