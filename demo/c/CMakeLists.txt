cmake_minimum_required(VERSION 3.13)
project(leopard_demo)

set(CMAKE_C_STANDARD 99)
set(CMAKE_BUILD_TYPE Release)

include_directories("${PROJECT_SOURCE_DIR}/../../include")

add_executable(leopard_demo leopard_demo.c)

if (NOT WIN32)
    target_link_libraries(leopard_demo dl ${PROJECT_SOURCE_DIR}/libpv_leopard.so)
endif()
