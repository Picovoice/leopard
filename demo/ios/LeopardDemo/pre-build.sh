#!/bin/sh

mkdir -p "${SRCROOT}/LeopardDemo/models/"

rm "${SRCROOT}/LeopardDemo/models/"*

if [ $1 == 'en' ];
then
    cp "${SRCROOT}/../../../lib/common/leopard_params.pv" "${SRCROOT}/LeopardDemo/models/"
else
    cp "${SRCROOT}/../../../lib/common/leopard_params_$1.pv" "${SRCROOT}/LeopardDemo/models/"
fi
