#!/bin/bash

#usage biblia.sh Mt7,15-20

for werset in "$@"
do
    echo "";
    echo $werset;
    echo "==========";
    curl -s -XPOST http://biblia.info.pl/cgi-bin/biblia-werset.cgi --data "werset=$werset" |
    iconv -f ISO-8859-2 -t UTF-8 |
    sed 's/<[^<]*>//g' |
    grep -v "Biblia" | 
    grep -e '^$' -v;
    echo "";
done
