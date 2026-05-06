@echo off
setlocal
pushd %~dp0\..\frontend
docker build -t ai-generator-web:local .
popd
