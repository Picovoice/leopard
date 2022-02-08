if [ ! -d "./leopard-demo-app/src/androidTest/assets/test_resources/audio" ]
then
    echo "Creating test audio samples directory..."
    mkdir -p ./leopard-demo-app/src/androidTest/assets/test_resources/audio
fi

echo "Copying test audio samples..."
cp ../../../resources/audio_samples/test.wav ./leopard-demo-app/src/androidTest/assets/test_resources/audio/test.wav

echo "Copying leopard model..."
cp ./leopard-demo-app/src/main/assets/leopard_params.pv ./leopard-demo-app/src/androidTest/assets/test_resources/leopard_params.pv
