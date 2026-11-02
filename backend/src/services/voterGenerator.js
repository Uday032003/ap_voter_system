// Andhra Pradesh Voter Directory - High-Fidelity Voter Record Synthesizer
// Generates realistic, authentic bilingual electoral roll records

const SURNAMES = [
  { en: 'Kilaru', te: 'కిలారు' },
  { en: 'Boyapati', te: 'బోయపాటి' },
  { en: 'Chennupati', te: 'చెన్నుపాటి' },
  { en: 'Vangala', te: 'వంగాల' },
  { en: 'Rayapati', te: 'రాయపాటి' },
  { en: 'Galla', te: 'గల్లా' },
  { en: 'Gottipati', te: 'గొట్టిపాటి' },
  { en: 'Paleti', te: 'పాలేటి' },
  { en: 'Kolla', te: 'కొల్లా' },
  { en: 'Nalluri', te: 'నల్లూరి' },
  { en: 'Thota', te: 'తోట' },
  { en: 'Daggubati', te: 'దగ్గుబాటి' },
  { en: 'Alapati', te: 'ఆలపాటి' },
  { en: 'Vadlamudi', te: 'వడ్లమూడి' },
  { en: 'Bandaru', te: 'బండారు' },
  { en: 'Pinnamaneni', te: 'పిన్నమనేని' },
  { en: 'Mandava', te: 'మాండవ' },
  { en: 'Gadde', te: 'గద్దె' },
  { en: 'Yarlagadda', te: 'యార్లగడ్డ' },
  { en: 'Chalasani', te: 'చలసాని' },
  { en: 'Kommineni', te: 'కొమ్మినేని' },
  { en: 'Maddipati', te: 'మద్దిపాటి' },
  { en: 'Bollineni', te: 'బొల్లినేని' },
  { en: 'Gorantla', te: 'గోరంట్ల' }
];

const MALE_NAMES = [
  { en: 'Venkata Rao', te: 'వెంకటరావు' },
  { en: 'Srinivasa Rao', te: 'శ్రీనివాసరావు' },
  { en: 'Ramakrishna', te: 'రామకృష్ణ' },
  { en: 'Nageswara Rao', te: 'నాగేశ్వరరావు' },
  { en: 'Satyanarayana', te: 'సత్యనారాయణ' },
  { en: 'Subba Rao', te: 'సుబ్బారావు' },
  { en: 'Anji Reddy', te: 'అంజిరెడ్డి' },
  { en: 'Sambasiva Rao', te: 'సాంబశివరావు' },
  { en: 'Sivaji', te: 'శివాజీ' },
  { en: 'Suresh Kumar', te: 'సురేష్ కుమార్' },
  { en: 'Naresh', te: 'నరేష్' },
  { en: 'Sai Krishna', te: 'సాయి కృష్ణ' },
  { en: 'Tarun Kumar', te: 'తరుణ్ కుమార్' },
  { en: 'Kalyan', te: 'కళ్యాణ్' },
  { en: 'Pawan Teja', te: 'పవన్ తేజ' },
  { en: 'Harish', te: 'హరీష్' },
  { en: 'Jagadeesh', te: 'జగదీష్' },
  { en: 'Mohan Rao', te: 'మోహనరావు' },
  { en: 'Prasad', te: 'ప్రసాద్' },
  { en: 'Ramesh Babu', te: 'రమేష్ బాబు' },
  { en: 'Appa Rao', te: 'అప్పారావు' },
  { en: 'Koti Reddy', te: 'కోటిరెడ్డి' }
];

const FEMALE_NAMES = [
  { en: 'Lakshmi Parvathi', te: 'లక్ష్మి పార్వతి' },
  { en: 'Sujatha', te: 'సుజాత' },
  { en: 'Bhavani', te: 'భవాని' },
  { en: 'Siva Kumari', te: 'శివకుమారి' },
  { en: 'Padmavathi', te: 'పద్మావతి' },
  { en: 'Anitha', te: 'అనిత' },
  { en: 'Vijaya Lakshmi', te: 'విజయలక్ష్మి' },
  { en: 'Anuradha', te: 'అనూరాధ' },
  { en: 'Sailaja', te: 'శైలజ' },
  { en: 'Srilatha', te: 'శ్రీలత' },
  { en: 'Geetha', te: 'గీత' },
  { en: 'Swapna', te: 'స్వప్న' },
  { en: 'Divya', te: 'దివ్య' },
  { en: 'Mounika', te: 'మౌనిక' },
  { en: 'Madhavi', te: 'మాధవి' },
  { en: 'Durga Devi', te: 'దుర్గాదేవి' },
  { en: 'Sarojini', te: 'సరోజిని' },
  { en: 'Kamala', te: 'కమల' },
  { en: 'Renuka', te: 'రేణుక' },
  { en: 'Hymavathi', te: 'హైమావతి' }
];

const ADMIN_TAGS = ['General', 'Senior Citizen', 'PWD', 'Youth', 'NRI', 'New Voter'];

export function generateVoterRecords(constituencyId, parts, totalCount = 3000) {
  const records = [];
  const countPerPart = Math.ceil(totalCount / parts.length);
  let globalIndex = 1;

  for (let p = 0; p < parts.length; p++) {
    const part = parts[p];
    const targetInThisPart = (p === parts.length - 1) ? (totalCount - records.length) : countPerPart;

    for (let s = 1; s <= targetInThisPart; s++) {
      const isMale = (s % 2 !== 0);
      const surname = SURNAMES[(globalIndex * 7 + s) % SURNAMES.length];
      const firstNameObj = isMale 
        ? MALE_NAMES[(globalIndex * 13 + s) % MALE_NAMES.length] 
        : FEMALE_NAMES[(globalIndex * 11 + s) % FEMALE_NAMES.length];
      
      const relObj = MALE_NAMES[(globalIndex * 17 + s + 3) % MALE_NAMES.length];
      const relType = isMale ? 'Father' : (s % 3 === 0 ? 'Father' : 'Husband');

      const houseMain = ((s % 180) + 1);
      const houseSub = (s % 5 === 0) ? '/A' : (s % 7 === 0 ? '/B' : '');
      const houseEn = `${p + 1}-${houseMain}${houseSub}`;
      const houseTe = `${p + 1}-${houseMain}${houseSub === '/A' ? '/ఎ' : houseSub === '/B' ? '/బి' : ''}`;

      const age = 18 + ((s * 3 + globalIndex) % 72);
      const paddedSerial = String(s).padStart(4, '0');
      const epicNumber = `AP07***${part.part_number}${paddedSerial.slice(-2)}`;

      // 94% approved, 5% needs_review, 1% flagged
      let reviewStatus = 'approved';
      if (s % 20 === 0) reviewStatus = 'needs_review';
      if (s % 100 === 0) reviewStatus = 'flagged';

      const adminTag = age >= 65 ? 'Senior Citizen' : (age <= 21 ? 'Youth' : ADMIN_TAGS[s % ADMIN_TAGS.length]);

      records.push({
        id: `vtr-${part.part_number}-${s}`,
        constituency_id: constituencyId,
        part_id: part.id,
        part_number: part.part_number,
        part_name_en: part.part_name_en,
        part_name_te: part.part_name_te,
        ward_id: `w1111111-0000-0000-0000-00000000000${(s % 3) + 1}`,
        serial_number: s,
        epic_number_masked: epicNumber,
        name_en: `${firstNameObj.en} ${surname.en}`,
        name_te: `${firstNameObj.te} ${surname.te}`,
        relative_type: relType,
        relative_name_en: `${relObj.en} ${surname.en}`,
        relative_name_te: `${relObj.te} ${surname.te}`,
        house_number_en: houseEn,
        house_number_te: houseTe,
        age: age,
        gender: isMale ? 'M' : 'F',
        is_public_approved: reviewStatus === 'approved' && (s % 10 !== 0), // approved subset for lawful commoner display
        review_status: reviewStatus,
        admin_tag: adminTag,
        source_file: `MGL_Atmakuru_Part${part.part_number}_2024.pdf`,
        source_page: Math.ceil(s / 30),
        created_at: new Date(Date.now() - (3000 - globalIndex) * 60000).toISOString(),
        updated_at: new Date(Date.now() - (3000 - globalIndex) * 60000).toISOString()
      });

      globalIndex++;
    }
  }

  return records;
}
