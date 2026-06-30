export interface District { id:string; name:string; hq:string; cities:string[] }

export const DISTRICTS: District[] = [
  {id:'bengaluru-urban',name:'Bengaluru Urban',hq:'Bengaluru',cities:['Bengaluru','Koramangala','Indiranagar','Whitefield','Electronic City','Jayanagar','Malleshwaram','Yelahanka','Mahadevapura','Hebbal','HSR Layout','BTM Layout','JP Nagar','Marathahalli','Bannerghatta Road','Devanahalli']},
  {id:'bengaluru-rural',name:'Bengaluru Rural',hq:'Bengaluru',cities:['Doddaballapur','Devanahalli','Hoskote','Nelamangala','Magadi','Ramanagara','Channapatna']},
  {id:'mysuru',name:'Mysuru',hq:'Mysuru',cities:['Mysuru','Hunsur','Nanjangud','Periyapatna','H.D. Kote','Srirangapatna','T. Narasipur']},
  {id:'mandya',name:'Mandya',hq:'Mandya',cities:['Mandya','Maddur','Malavalli','Nagamangala','Pandavapura','Srirangapatna','K.M. Doddi']},
  {id:'hassan',name:'Hassan',hq:'Hassan',cities:['Hassan','Arsikere','Belur','Channarayapatna','Holenarasipur','Sakaleshpur','Shravanabelagola']},
  {id:'kodagu',name:'Kodagu',hq:'Madikeri',cities:['Madikeri','Virajpet','Somwarpet','Kushalnagar','Gonikoppal','Ponnampet']},
  {id:'chamarajanagar',name:'Chamarajanagar',hq:'Chamarajanagar',cities:['Chamarajanagar','Gundlupet','Kollegal','Yelandur']},
  {id:'mangaluru',name:'Dakshina Kannada',hq:'Mangaluru',cities:['Mangaluru','Bantwal','Puttur','Sullia','Moodabidri','Mulki','Ullal','Uppinangady']},
  {id:'udupi',name:'Udupi',hq:'Udupi',cities:['Udupi','Karkala','Kundapura','Brahmavar','Manipal','Byndoor','Kaup']},
  {id:'chikmagalur',name:'Chikmagalur',hq:'Chikmagalur',cities:['Chikmagalur','Kadur','Koppa','Mudigere','Sringeri','Tarikere','Birur']},
  {id:'shivamogga',name:'Shivamogga',hq:'Shivamogga',cities:['Shivamogga','Bhadravati','Sagar','Soraba','Shikaripura','Thirthahalli','Hosanagara']},
  {id:'davangere',name:'Davangere',hq:'Davangere',cities:['Davangere','Channagiri','Harihar','Harapanahalli','Honnali','Jagalur','Mayakonda']},
  {id:'chitradurga',name:'Chitradurga',hq:'Chitradurga',cities:['Chitradurga','Challakere','Hiriyur','Holalkere','Hosadurga','Molakalmuru']},
  {id:'tumkur',name:'Tumkur',hq:'Tumkur',cities:['Tumkur','Chikkanayakanahalli','Gubbi','Koratagere','Kunigal','Madhugiri','Pavagada','Sira','Tiptur']},
  {id:'kolar',name:'Kolar',hq:'Kolar',cities:['Kolar','Bangarpet','Chintamani','KGF','Malur','Mulbagal','Srinivaspur']},
  {id:'chikkaballapur',name:'Chikkaballapur',hq:'Chikkaballapur',cities:['Chikkaballapur','Bagepalli','Gauribidanur','Sidlaghatta','Nandi Hills']},
  {id:'ramanagara',name:'Ramanagara',hq:'Ramanagara',cities:['Ramanagara','Channapatna','Kanakapura','Magadi','Bidadi']},
  {id:'belagavi',name:'Belagavi',hq:'Belagavi',cities:['Belagavi','Athani','Bailhongal','Chikodi','Gokak','Nippani','Sankeshwar','Savadatti']},
  {id:'dharwad',name:'Dharwad',hq:'Dharwad',cities:['Dharwad','Hubballi','Annigeri','Kalghatagi','Kundgol','Navalgund','Savanur']},
  {id:'gadag',name:'Gadag',hq:'Gadag',cities:['Gadag','Betgeri','Mundargi','Nargund','Ron','Shirhatti','Lakshmeshwar']},
  {id:'haveri',name:'Haveri',hq:'Haveri',cities:['Haveri','Byadagi','Hanagal','Hirekerur','Ranebennur','Savanur','Shiggaon']},
  {id:'uttara-kannada',name:'Uttara Kannada',hq:'Karwar',cities:['Karwar','Ankola','Bhatkal','Dandeli','Honavar','Kumta','Sirsi','Gokarna','Murudeshwar']},
  {id:'vijayapura',name:'Vijayapura',hq:'Vijayapura',cities:['Vijayapura','Basavana Bagewadi','Indi','Muddebihal','Sindagi','Talikot']},
  {id:'bagalkot',name:'Bagalkot',hq:'Bagalkot',cities:['Bagalkot','Badami','Bilagi','Hungund','Jamkhandi','Mudhol','Rabakavi-Banahatti','Guledagudda']},
  {id:'koppal',name:'Koppal',hq:'Koppal',cities:['Koppal','Gangavathi','Kustagi','Yelburga','Munirabad']},
  {id:'ballari',name:'Ballari',hq:'Ballari',cities:['Ballari','Hospet','Hadagali','Sandur','Siruguppa','Kampli','Hampi']},
  {id:'vijayanagara',name:'Vijayanagara',hq:'Hospet',cities:['Hospet','Hagaribommanahalli','Hoovinahadagali','Kudligi','Hampi','Kampli']},
  {id:'raichur',name:'Raichur',hq:'Raichur',cities:['Raichur','Devadurga','Lingsugur','Manvi','Maski','Sindhanur','Mudgal']},
  {id:'yadgir',name:'Yadgir',hq:'Yadgir',cities:['Yadgir','Shahapur','Shorapur','Hunasagi','Gurumitkal']},
  {id:'kalaburagi',name:'Kalaburagi',hq:'Kalaburagi',cities:['Kalaburagi','Afzalpur','Aland','Chincholi','Chittapur','Jewargi','Sedam','Shahabad','Wadi']},
  {id:'bidar',name:'Bidar',hq:'Bidar',cities:['Bidar','Aurad','Basavakalyan','Bhalki','Humnabad','Chitaguppa']},
]

export const DISTRICT_NAMES = DISTRICTS.map(d=>d.name).sort()
export function getCities(districtId: string): string[] {
  return DISTRICTS.find(d=>d.id===districtId)?.cities ?? []
}
