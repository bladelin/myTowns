<?php
$countrySort = array (
  '宜蘭縣' => 1,
  '基隆市' => 2,
  '台北市' => 3,
  '新北市' => 4,
  '桃園縣' => 5,
  '新竹市' => 6,
  '新竹縣' => 7,
  '苗栗縣' => 8,
  '南投縣' => 9,
  '台中市' => 10,
  '彰化縣' => 11,
  '雲林縣' => 12,
  '嘉義市' => 13,
  '嘉義縣' => 14,
  '台南市' => 15,
  '高雄市' => 16,
  '屏東縣' => 17,
  '台東縣' => 18,
  '花蓮縣' => 19,
  '澎湖縣' => 20,
  '金門縣' => 21,
  '連江縣' => 22,
);


$file = 'runtime/town_all_20160104105547.txt';
$res = file_get_contents($file);
$res = explode("\n", $res);

foreach ($res as $key => $item)
{
    $val = explode(";", $item);
    if (empty($val[3])) {
    	continue;
    }

    $gps = process($val[3]);
    $gps = shrink($gps);
    $country = $val[1];
    $id = $country.'-'.$val[2];

    $collection[$country][$id]['location'] = $country.'-'.$val[2];
    $collection[$country][$id]['gps'] = $gps;
}

uksort($collection, function($a, $b) {
    global $countrySort;
    if ($countrySort[$a] == $countrySort[$b]) {
        return 0;
    }
    return ($countrySort[$a]  < $countrySort[$b]) ? -1 : 1;
});

function shrink($gps)
{
    $degree = 8;
    $newGps  = [];
    $i = 0;
    $accurancy = 8;
    $cnt = count($gps);
    foreach ($gps as $key => $val) {
        if ($cnt <= 100 || $i % $accurancy == 0) {
            $index= substr($val[0], 0, $degree).substr($val[1], 0, $degree);
            $val[0] = substr($val[0], 0, $degree+1);
            $val[1] = substr($val[1], 0, $degree+1);
            $newGps[$index] = $val;
        }
        $i++;

    }
    return $newGps;
}

function process($list)
{
    $js = [];
    $i = 0;
    $res = explode(",", $list);
    $distinct= [];
    foreach ($res as $key=> $val) {

        $val = (double)$val;
	$js[$i][] = $val;

        if ($key % 2 !=0 ) {
    	    $i++;
        }
    }
    return $js;
}

$content = json_encode($collection, true);
echo $content;



