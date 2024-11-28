// swift-tools-version:5.3
import PackageDescription
let package = Package(
    name: "Leopard-iOS",
    platforms: [
        .iOS(.v13)
    ],
    products: [
        .library(
            name: "Leopard",
            targets: ["Leopard"]
        )
    ],
    targets: [
        .binaryTarget(
            name: "PvLeopard",
            path: "lib/ios/PvLeopard.xcframework"
        ),
        .target(
            name: "Leopard",
            dependencies: ["PvLeopard"],
            path: ".",
            exclude: [
                "binding/ios/LeopardAppTest",
                "binding/flutter",
                "binding/react-native",
                "demo"
            ],
            sources: [
                "binding/ios/Leopard.swift",
                "binding/ios/LeopardErrors.swift"
            ]
        )
    ]
)
