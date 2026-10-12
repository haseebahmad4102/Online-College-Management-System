<?php

namespace App\Services;

use setasign\Fpdi\Fpdi;
use Illuminate\Support\Facades\Storage;

class PdfService
{
    public static function buildApplicationPdf($app)
    {
        $pdf = new Fpdi();
        $pdf->SetAutoPageBreak(false);
        $pdf->AddPage('P', 'A4');
        
        $green = [20, 84, 46];
        $ink = [31, 41, 54];
        $gray = [115, 128, 143];

        $left = 18;
        $right = 192;
        $y = 15;
        
        $pdf->SetTextColor(...$green);
        $pdf->SetFont('Helvetica', 'B', 16);
        $title = 'Government Graduate College Muzaffargarh';
        $w = $pdf->GetStringWidth($title);
        $pdf->Text((210 - $w) / 2, $y, $title);
        
        $y += 7;
        $pdf->SetTextColor(...$gray);
        $pdf->SetFont('Helvetica', '', 11);
        $sub = 'Admission Application Form';
        $w = $pdf->GetStringWidth($sub);
        $pdf->Text((210 - $w) / 2, $y, $sub);
        
        $y += 6;
        $pdf->SetDrawColor(...$green);
        $pdf->SetLineWidth(0.4);
        $pdf->Line($left, $y, $right, $y);
        $y += 7;

        $checkPage = function($space) use (&$pdf, &$y) {
            if ($y > (297 - $space)) {
                $pdf->AddPage('P', 'A4');
                $y = 15;
            }
        };

        $sectionHeader = function($title) use (&$pdf, &$y, $left, $right, $green, &$checkPage) {
            $checkPage(30);
            $y += 5;
            $pdf->SetTextColor(...$green);
            $pdf->SetFont('Helvetica', 'B', 10);
            $pdf->Text($left, $y, strtoupper($title));
            $y += 2;
            $pdf->SetDrawColor(...$green);
            $pdf->SetLineWidth(0.2);
            $pdf->Line($left, $y, $right, $y);
            $y += 6;
        };

        $fieldRows = function($pairs) use (&$pdf, &$y, $left, $gray, $ink, &$checkPage) {
            $colW = 85;
            for ($i = 0; $i < count($pairs); $i += 2) {
                $checkPage(25);
                $rowPairs = [$pairs[$i]];
                if (isset($pairs[$i+1])) $rowPairs[] = $pairs[$i+1];
                
                $rowHeight = 0;
                foreach ($rowPairs as $col => $pair) {
                    $x = $col === 0 ? $left : $left + 90;
                    $pdf->SetTextColor(...$gray);
                    $pdf->SetFont('Helvetica', 'B', 7);
                    $pdf->Text($x, $y, strtoupper($pair[0]));
                    
                    $pdf->SetTextColor(...$ink);
                    $pdf->SetFont('Helvetica', '', 10);
                    $pdf->SetXY($x, $y + 1);
                    $pdf->MultiCell($colW, 4, $pair[1] ?? '—', 0, 'L');
                    
                    $h = $pdf->GetY() - $y + 4;
                    if ($h > $rowHeight) $rowHeight = $h;
                }
                $y += $rowHeight;
            }
        };

        $pct = fn($o, $t) => ($o && $t) ? number_format(($o / $t) * 100, 1) . '%' : '—';
        $dmy = fn($d) => $d ? date('d/m/Y', strtotime($d)) : '—';

        $fieldRows([
            ['Application No', $app->application_no],
            ['Status', str_replace('_', ' ', $app->status)],
            ['Program', $app->program->name ?? ''],
            ['Admission cycle', $app->cycle->title ?? ''],
        ]);

        $sectionHeader('Personal information');
        $fieldRows([
            ['Full name', $app->name],
            ['Father name', $app->father_name],
            ['CNIC / B-Form', $app->cnic_bform],
            ['Gender', $app->gender],
            ['Date of birth', $dmy($app->dob)],
            ['Religion', $app->religion],
            ['Marital status', $app->marital_status],
            ['Blood group', $app->blood_group],
            ['Hafiz-e-Quran', $app->is_hafiz ? 'Yes (bonus applies)' : 'No'],
            ['Disability', $app->has_disability ? ($app->disability_details ?: 'Yes') : 'None'],
            ['Medical conditions', $app->medical_conditions ?: 'None declared'],
        ]);

        $sectionHeader('Contact');
        $fieldRows([
            ['Phone', $app->phone],
            ['Guardian phone', $app->guardian_phone],
            ['Province', $app->province],
            ['Domicile district', $app->domicile],
            ['Postal address', $app->address],
        ]);

        $sectionHeader('Academic record');
        $matricRow = [
            ['Matriculation', "{$app->matric_board} {$app->matric_year} — Roll {$app->matric_roll_no}"],
            ['Matric marks', "{$app->matric_obtained}/{$app->matric_total} (" . $pct($app->matric_obtained, $app->matric_total) . ")"],
        ];
        if ($app->inter_obtained) {
            $ig = $app->interGroup ? $app->interGroup->name : '';
            $matricRow[] = ['Intermediate', "{$app->inter_board} {$app->inter_year} — Roll {$app->inter_roll_no}" . ($ig ? " ($ig)" : '')];
            $matricRow[] = ['Intermediate marks', "{$app->inter_obtained}/{$app->inter_total} (" . $pct($app->inter_obtained, $app->inter_total) . ")"];
        }
        if ($app->merit_score) {
            $matricRow[] = ['Merit score', (string)$app->merit_score];
        }
        $fieldRows($matricRow);

        $sectionHeader('Documents checklist');
        foreach ($app->documents ?? [] as $d) {
            $checkPage(20);
            $pdf->SetTextColor(...$ink);
            $pdf->SetFont('Helvetica', '', 10);
            $pdf->Text($left, $y, chr(149)); // bullet
            $pdf->Text($left + 4, $y, $d->documentType->name ?? 'Document');
            
            $status = str_replace('_', ' ', $d->status);
            if ($d->status === 'approved') $pdf->SetTextColor(...$green);
            elseif ($d->status === 'rejected') $pdf->SetTextColor(178, 25, 38);
            else $pdf->SetTextColor(...$gray);
            $pdf->SetFont('Helvetica', 'B', 10);
            $pdf->Text($left + 105, $y, $status);
            $y += 5;
            
            if ($d->remarks) {
                $checkPage(15);
                $pdf->SetTextColor(...$gray);
                $pdf->SetFont('Helvetica', '', 8);
                $pdf->SetXY($left + 4, $y - 3);
                $pdf->MultiCell(150, 4, "Remarks: " . $d->remarks, 0, 'L');
                $y = $pdf->GetY() + 2;
            }
        }

        if ($app->status === 'rejected' && $app->remarks) {
            $sectionHeader('Rejection reason');
            $checkPage(15);
            $pdf->SetTextColor(178, 25, 38);
            $pdf->SetFont('Helvetica', '', 10);
            $pdf->SetXY($left, $y);
            $pdf->MultiCell(170, 5, $app->remarks, 0, 'L');
            $y = $pdf->GetY() + 4;
        }

        $checkPage(40);
        $y += 10;
        $pdf->SetDrawColor(...$ink);
        $pdf->SetLineWidth(0.2);
        $pdf->Line($left, $y, $left + 60, $y);
        $pdf->Line($right - 60, $y, $right, $y);
        $y += 4;
        $pdf->SetTextColor(...$gray);
        $pdf->SetFont('Helvetica', '', 8);
        $pdf->Text($left, $y, 'Applicant signature');
        $w = $pdf->GetStringWidth('Verified by (office)');
        $pdf->Text($right - $w, $y, 'Verified by (office)');
        $y += 6;
        $pdf->SetFont('Helvetica', '', 7.5);
        $pdf->Text($left, $y, 'Generated ' . date('d/m/Y H:i:s') . ' — GGCM Online College Management System');

        // Attachments
        foreach ($app->documents ?? [] as $d) {
            if (!$d->file_path) continue;
            
            $fullPath = storage_path("app/private/" . $d->file_path);
            if (!file_exists($fullPath)) continue;

            $label = "Attachment: " . ($d->documentType->name ?? 'Document') . " (" . str_replace('_', ' ', $d->status) . ")";
            $ext = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));

            if (in_array($ext, ['jpg', 'jpeg', 'png'])) {
                $pdf->AddPage('P', 'A4');
                $pdf->SetTextColor(...$green);
                $pdf->SetFont('Helvetica', 'B', 10);
                $pdf->Text($left, 10, $label);
                
                // Embed image scaled
                list($w_orig, $h_orig) = getimagesize($fullPath);
                $maxW = 175;
                $maxH = 260;
                $scale = min($maxW / $w_orig, $maxH / $h_orig, 25.4/96); // Basic dpi scale
                $w = $w_orig * $scale;
                $h = $h_orig * $scale;
                
                $pdf->Image($fullPath, (210 - $w) / 2, 20, $w, $h);
            } elseif ($ext === 'pdf') {
                try {
                    $pageCount = $pdf->setSourceFile($fullPath);
                    for ($pageNo = 1; $pageNo <= $pageCount; $pageNo++) {
                        $tplIdx = $pdf->importPage($pageNo);
                        $s = $pdf->getTemplateSize($tplIdx);
                        $pdf->AddPage($s['orientation'], [$s['width'], $s['height']]);
                        $pdf->useTemplate($tplIdx);
                        if ($pageNo === 1) {
                            $pdf->SetTextColor(...$green);
                            $pdf->SetFont('Helvetica', 'B', 9);
                            $pdf->Text(10, 10, $label);
                        }
                    }
                } catch (\Exception $e) {
                    // Ignore unreadable PDF
                }
            }
        }

        return $pdf->Output('S');
    }
}
