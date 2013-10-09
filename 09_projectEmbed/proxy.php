<?php

require('config.php');

function buildUrl() {
  $format = 'json';

  $query = $_POST['query'];

  $searchUrl = 'http://tsb-projects.labs.theodi.org/sparql?'
    .'query='.urlencode($query)
    .'&format='.$format;

  return $searchUrl;
}

function request($url) {
  global $USER_PASS;

  if (!function_exists('curl_init')){
    die('CURL is not installed!');
  }

  $ch = curl_init();

  curl_setopt($ch, CURLOPT_HEADER, 0); //don't print headers
  curl_setopt($ch, CURLOPT_USERPWD, $USER_PASS); //http basic auth
  curl_setopt($ch, CURLOPT_URL, $url);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); //don't print response

  $response = curl_exec($ch);

  curl_close($ch);

  return $response;
}

header("Content-Type: application/json");

$requestURL = buildUrl();
echo request($requestURL);

?>