@echo off
setlocal
pushd %~dp0
docker compose ps
docker compose logs --tail 50 api
docker compose logs --tail 50 billing-service
docker compose logs --tail 50 generation-service
popd
