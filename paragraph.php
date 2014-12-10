<?php 

# TODO: database sort by book

header('Content-Type: application/json');
$DBFILE = 'data/gospel.sqlite3';

function getRefs($get) {
    $ret = array();
    $query_string = $get['q'];
    $refs = explode(';', $query_string);
    foreach ($refs as $ref) {
        if (! preg_match("/^[a-zA-Z]+[0-9]+,[0-9]+-[0-9]+$/", $ref)) {
            return array();
        }
        $ret[strtolower($ref)] = 1;
    }
    return array_keys($ret);
}

function fetchContents($dbfile, $refs) {
    $ret = array();
    $db = new SQLite3($dbfile);
    $placeholders = implode(',', array_fill(0, count($refs), '?'));
    $statement = $db->prepare("SELECT ref, content FROM gospel WHERE ref IN ($placeholders) ORDER BY ref DESC");
    for ($i=0; $i<count($refs); $i++) {
        $statement->bindValue($i + 1, $refs[$i]);
    }
    $results = $statement->execute();
    while ($row = $results->fetchArray(SQLITE3_ASSOC)) {
        array_push($ret, $row);
    }
    return $ret;
}



$refs = getRefs($_GET);

if (count($refs) < 1) {
    header("HTTP/1.0 400 Bad request");
    echo '{"message": "Invalid query"}';
    die();
}

$contents = fetchContents($DBFILE, $refs);

if (count($contents) != count($refs)) {
    header("HTTP/1.0 400 Bad request");
    echo '{"message": "Cannot fetch data for all provided refs"}';
    die();
}

echo json_encode($contents);

?>



