<?php
$sec = App\Models\ClassSection::whereHas('program', function($q){ $q->where('name', 'like', '%Zoology%'); })->first();
if ($sec) {
    echo "ID: {$sec->id}, term_no: '{$sec->term_no}', name: '{$sec->name}'";
} else {
    echo "Not found";
}
