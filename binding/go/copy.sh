#!/bin/bash

echo "Copying leopard model..."
cp ../../lib/common/leopard_params.pv ./embedded/lib/common/leopard_params.pv

echo "Copying Linux lib..."
cp ../../lib/linux/x86_64/libpv_leopard.so ./embedded/lib/linux/x86_64/libpv_leopard.so

echo "Copying macOS libs..."
cp ../../lib/mac/x86_64/libpv_leopard.dylib ./embedded/lib/mac/x86_64/libpv_leopard.dylib
cp ../../lib/mac/arm64/libpv_leopard.dylib ./embedded/lib/mac/arm64/libpv_leopard.dylib

echo "Copying Windows lib..."
cp ../../lib/windows/amd64/libpv_leopard.dll ./embedded/lib/windows/amd64/libpv_leopard.dll

echo "Copying RPi libs..."
cp -rp ../../lib/raspberry-pi/* ./embedded/lib/raspberry-pi

echo "Copying Jetson lib..."
cp ../../lib/jetson/cortex-a57-aarch64/libpv_leopard.so ./embedded/lib/jetson/cortex-a57-aarch64/libpv_leopard.so

echo "Copy complete!"
