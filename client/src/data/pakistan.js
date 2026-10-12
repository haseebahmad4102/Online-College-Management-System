// Reference data for admission forms — kept in one place so every dropdown stays consistent.

// Domicile districts of Pakistan grouped by province / territory.
// Applicants pick the province first; the district list narrows accordingly.
export const DISTRICTS_BY_PROVINCE = {
  Punjab: [
    'Attock', 'Bahawalnagar', 'Bahawalpur', 'Bhakkar', 'Chakwal', 'Chiniot', 'Dera Ghazi Khan',
    'Faisalabad', 'Gujranwala', 'Gujrat', 'Hafizabad', 'Jhang', 'Jhelum', 'Kasur', 'Khanewal',
    'Khushab', 'Kot Addu', 'Lahore', 'Layyah', 'Lodhran', 'Mandi Bahauddin', 'Mianwali',
    'Multan', 'Murree', 'Muzaffargarh', 'Nankana Sahib', 'Narowal', 'Okara', 'Pakpattan',
    'Rahim Yar Khan', 'Rajanpur', 'Rawalpindi', 'Sahiwal', 'Sargodha', 'Sheikhupura', 'Sialkot',
    'Talagang', 'Toba Tek Singh', 'Vehari', 'Wazirabad',
  ],
  Sindh: [
    'Badin', 'Dadu', 'Ghotki', 'Hyderabad', 'Jacobabad', 'Jamshoro', 'Karachi Central',
    'Karachi East', 'Karachi South', 'Karachi West', 'Kambar Shahdadkot', 'Kashmore', 'Keamari',
    'Khairpur', 'Korangi', 'Larkana', 'Malir', 'Matiari', 'Mirpur Khas', 'Naushahro Feroze',
    'Sanghar', 'Shaheed Benazirabad (Nawabshah)', 'Shikarpur', 'Sujawal', 'Sukkur', 'Tando Allahyar',
    'Tando Muhammad Khan', 'Tharparkar', 'Thatta', 'Umerkot',
  ],
  'Khyber Pakhtunkhwa': [
    'Abbottabad', 'Bajaur', 'Bannu', 'Batagram', 'Buner', 'Charsadda', 'Chitral Lower',
    'Chitral Upper', 'Dera Ismail Khan', 'Dir', 'Hangu', 'Haripur', 'Karak', 'Khyber', 'Kohat',
    'Kohistan Lower', 'Kohistan Upper', 'Kolai Palas', 'Kurram', 'Lakki Marwat', 'Lower Dir',
    'Malakand', 'Mansehra', 'Mardan', 'Mohmand', 'North Waziristan', 'Nowshera', 'Orakzai',
    'Peshawar', 'Shangla', 'South Waziristan', 'Swabi', 'Swat', 'Tank', 'Torghar', 'Upper Dir',
  ],
  Balochistan: [
    'Awaran', 'Barkhan', 'Chagai', 'Dera Bugti', 'Duki', 'Gwadar', 'Harnai', 'Jafarabad',
    'Jhal Magsi', 'Kachhi (Bolan)', 'Kalat', 'Kech (Turbat)', 'Kharan', 'Khuzdar', 'Killa Abdullah',
    'Killa Saifullah', 'Kohlu', 'Lasbela', 'Loralai', 'Mastung', 'Musakhel', 'Nasirabad', 'Nushki',
    'Panjgur', 'Pishin', 'Quetta', 'Sherani', 'Sibi', 'Sohbatpur', 'Washuk', 'Zhob', 'Ziarat',
  ],
  'Islamabad Capital Territory': ['Islamabad'],
  'Azad Jammu & Kashmir': [
    'Bagh', 'Bhimber', 'Hattian Bala', 'Haveli', 'Kotli', 'Mirpur (AJK)', 'Muzaffarabad', 'Neelum',
    'Poonch (Rawalakot)', 'Sudhanoti',
  ],
  'Gilgit-Baltistan': [
    'Astore', 'Darel', 'Diamer', 'Ghanche', 'Ghizer', 'Gilgit', 'Gupis-Yasin', 'Hunza',
    'Kharmang', 'Nagar', 'Roundu', 'Shigar', 'Skardu', 'Tangir',
  ],
};

// Provinces / territories of Pakistan (mirrored by the server's validation list).
export const PROVINCES = Object.keys(DISTRICTS_BY_PROVINCE);

// Flat district list (all provinces), kept for screens that don't ask for a province.
export const DISTRICTS = PROVINCES.flatMap((p) => DISTRICTS_BY_PROVINCE[p]);

// Education boards of Pakistan (BISE / BSEK / FBISE / AKU-EB + provincial boards).
export const BOARDS = [
  // Punjab
  'BISE Lahore', 'BISE Rawalpindi', 'BISE Gujranwala', 'BISE Sargodha', 'BISE Faisalabad',
  'BISE Multan', 'BISE Bahawalpur', 'BISE Dera Ghazi Khan', 'BISE Sahiwal',
  // Sindh
  'BSEK Karachi (Secondary)', 'BIEK Karachi (Intermediate)', 'BISE Hyderabad', 'BISE Sukkur',
  'BISE Larkana', 'BISE Mirpurkhas', 'BISE Shaheed Benazirabad (Nawabshah)', 'Aga Khan Board (AKU-EB)',
  // Khyber Pakhtunkhwa
  'BISE Peshawar', 'BISE Mardan', 'BISE Kohat', 'BISE Bannu', 'BISE Dera Ismail Khan',
  'BISE Abbottabad', 'BISE Swat', 'BISE Malakand',
  // Balochistan
  'BISE Quetta (Balochistan Board)',
  // Federal & regions
  'Federal Board (FBISE) Islamabad', 'AJK Board Mirpur', 'Gilgit-Baltistan Board',
  // Technical / others
  'Punjab Board of Technical Education (PBTE)', 'Sindh Board of Technical Education (SBTE)',
  'Other',
];

export const RELIGIONS = ['Islam', 'Christianity', 'Hinduism', 'Sikhism', 'Parsi', 'Ahmadi', 'Other'];
