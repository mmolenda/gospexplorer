#!/bin/bash

# CREATE TABLE gospel (ref varchar(16) PRIMARY KEY, content text);

# grep ref data.json | sed 's/^.*ref": "\(.*\)", "g.*$/\1/g'

DBFILE=gospel.sqlite3;

for verse in "$@"
do
    echo $verse;
    lowerverse=$(echo $verse | tr '[:upper:]' '[:lower:]')
    content=$(curl -s -XPOST http://biblia.info.pl/cgi-bin/biblia-werset.cgi --data "werset=$verse" |
    iconv -f ISO-8859-2 -t UTF-8 |
    sed 's/<[^<]*>//g' |
    grep -v "Biblia" | 
    grep -e '^$' -v |
    tr '\n' ' ' | 
    sed -e 's/([0-9]*)//g' -e 's/  */ /g' -e 's/^ //g' -e 's/ *$//g')
    echo "INSERT INTO gospel VALUES ('$lowerverse', '$content');" | sqlite3 $DBFILE;
done
