// Jobs & CVs ([jobs-forehead:R] and jobs-guess.js): the 48 job cards of the forehead game and the yes / no questions of "Who am I?" against the computer.
// JOBS: the cards of [jobcards-1…3] (id, name, emoji, what the card says).
// q: the question as the computer suggests it. forms: other ways to say it that the computer accepts.
// yes: the jobs for which the answer is YES · some: the jobs for which it is "Sometimes" · for all the others it is NO. (Space-separated ids.)
// The answer follows the first word of the question typed: Am I → "Yes, you are." · Do I → "Yes, you do." · Can I → "Yes, you can." · Is my job → "Yes, it is."
// group: money · place · body · people · tools · skills · time · what (one line for each aspect of a job).

window.JOBS_DATA = (() => {
  const JOBS = [
    ['doctor', 'Doctor', '🩺', 'helps sick people get better'], ['nurse', 'Nurse', '💉', 'looks after patients in a hospital'],
    ['dentist', 'Dentist', '🦷', 'looks after your teeth'], ['vet', 'Vet', '🐶', 'treats sick animals'],
    ['teacher', 'Teacher', '📚', 'works in a school'], ['chef', 'Chef', '🍳', 'cooks in a restaurant'],
    ['pilot', 'Pilot', '✈️', 'flies planes'], ['police', 'Police officer', '🚓', 'keeps people safe'],
    ['fire', 'Fire officer', '🚒', 'puts out fires'], ['farmer', 'Farmer', '🚜', 'grows food and keeps animals'],
    ['builder', 'Builder', '🧱', 'builds houses'], ['mechanic', 'Car mechanic', '🔧', 'repairs cars'],
    ['hairdresser', 'Hairdresser', '✂️', 'cuts and styles hair'], ['shop', 'Shop assistant', '🛍️', 'sells things in a shop'],
    ['taxi', 'Taxi driver', '🚕', 'drives people around the city'], ['driver', 'Driver', '🚚', 'drives a bus, a van or a truck'],
    ['astronaut', 'Astronaut', '🚀', 'travels into space'], ['actor', 'Actor', '🎭', 'plays characters in films and plays'],
    ['singer', 'Singer', '🎤', 'sings on stage'], ['footballer', 'Footballer', '⚽', 'plays football in a team'],
    ['photographer', 'Photographer', '📷', 'takes photos'], ['journalist', 'Journalist', '📰', 'writes the news'],
    ['author', 'Author', '✍️', 'writes books'], ['artist', 'Artist', '🎨', 'paints and draws'],
    ['fashion', 'Fashion designer', '👗', 'designs clothes'], ['web', 'Website developer', '💻', 'builds websites'],
    ['scientist', 'Scientist', '🔬', 'does experiments in a lab'], ['lawyer', 'Lawyer', '⚖️', 'helps people with the law'],
    ['waiter', 'Waiter', '🍽️', 'serves food in a restaurant'], ['ceo', 'CEO', '💼', 'is the boss of a company'],
    ['childminder', 'Childminder', '🧸', 'looks after children'], ['paramedic', 'Paramedic', '🚑', 'helps people in an emergency'],
    ['physio', 'Physiotherapist', '💆', 'helps you move again after an injury'], ['plumber', 'Plumber', '🚰', 'repairs pipes and taps'],
    ['electrician', 'Electrician', '💡', 'fixes lights and wires'], ['engineer', 'Engineer', '⚙️', 'designs machines and bridges'],
    ['architect', 'Architect', '📐', 'designs buildings'], ['baker', 'Baker', '🥐', 'makes bread and cakes'],
    ['postal', 'Postal worker', '📮', 'delivers letters and parcels'], ['pharmacist', 'Pharmacist', '💊', 'sells medicine in a chemist’s'],
    ['librarian', 'Librarian', '📖', 'works in a library'], ['attendant', 'Flight attendant', '🧳', 'looks after passengers on a plane'],
    ['lifeguard', 'Lifeguard', '🛟', 'watches swimmers at the beach'], ['youtuber', 'YouTuber', '📹', 'makes videos for the internet'],
    ['receptionist', 'Receptionist', '🛎️', 'welcomes people at a hotel or an office'], ['cleaner', 'Cleaner', '🧽', 'cleans offices and houses'],
    ['guide', 'Tour guide', '🗺️', 'shows tourists around a city'], ['musician', 'Musician', '🎻', 'plays an instrument'],
  ].map(([id, name, pic, desc]) => ({ id, name, pic, desc }));

  const S = s => (s ? s.split(' ') : []);
  const Q = (id, group, q, yes, forms = [], some = '') => ({ id, group, q, yes: S(yes), some: S(some), forms });

  const QUESTIONS = [
    // ---- money and studies ----
    Q('money', 'money', 'Do I make a lot of money?', 'doctor dentist pilot astronaut lawyer ceo footballer engineer architect', ['Do I earn a lot of money?', 'Do I earn a lot?', 'Do I get a lot of money?', 'Do I make good money?'],
      'actor singer musician youtuber web vet pharmacist scientist plumber electrician photographer fashion'),
    Q('university', 'money', 'Do I need to go to university?', 'doctor nurse dentist vet teacher lawyer scientist engineer architect pharmacist physio paramedic astronaut journalist librarian', ['Do I have to go to university?', 'Do I need a degree?', 'Do I study at university?', 'Do I need to study at university?'],
      'web fashion ceo pilot author artist police childminder photographer guide'),
    Q('famous', 'money', 'Am I famous?', 'astronaut actor singer footballer youtuber', ['Am I a famous person?', 'Am I well known?', 'Am I very famous?'], 'musician author artist fashion photographer chef ceo journalist'),
    Q('boss', 'money', 'Am I the boss of a company?', 'ceo', ['Am I the boss?', 'Am I a boss?', 'Am I in charge of a company?', 'Am I the leader of a company?'], 'lawyer farmer'),
    Q('self', 'money', 'Can I work for myself?', 'photographer author artist youtuber plumber electrician hairdresser builder taxi musician singer fashion farmer childminder journalist', ['Can I be my own boss?', 'Can I be self-employed?', 'Can I work on my own?', 'Can I work as a freelancer?'], 'web lawyer baker mechanic physio vet dentist architect'),
    Q('suit', 'money', 'Do I wear smart clothes?', 'ceo lawyer receptionist', ['Do I wear a suit?', 'Do I wear a suit and tie?', 'Do I dress smartly?', 'Do I wear smart clothes for work?'], 'journalist architect pilot attendant guide'),
    Q('advice', 'money', 'Do I give advice to people?', 'lawyer pharmacist doctor teacher physio vet dentist', ['Do I give people advice?', 'Do I advise people?', 'Do I give advice?'], 'receptionist hairdresser librarian shop ceo guide'),
    // ---- place ----
    Q('outside', 'place', 'Do I work outside?', 'farmer builder postal lifeguard guide footballer', ['Do I work outdoors?', 'Do I work in the open air?', 'Do I work out of doors?'], 'police fire paramedic taxi driver photographer plumber electrician vet scientist architect engineer artist musician singer actor journalist youtuber'),
    Q('office', 'place', 'Do I work in an office?', 'ceo lawyer receptionist web architect engineer journalist', ['Do I work at a desk in an office?', 'Do I have an office?', 'Do I work in offices?'], 'author fashion cleaner librarian'),
    Q('hospital', 'place', 'Do I work in a hospital?', 'doctor nurse', ['Do I work in a clinic?', 'Do I work at a hospital?'], 'paramedic physio pharmacist dentist cleaner'),
    Q('restaurant', 'place', 'Do I work in a restaurant?', 'chef waiter', ['Do I work at a restaurant?', 'Do I work in a café?'], 'baker'),
    Q('shopplace', 'place', 'Do I work in a shop?', 'shop baker pharmacist', ['Do I work in a store?', 'Do I work at a shop?'], 'hairdresser fashion'),
    Q('school', 'place', 'Do I work in a school?', 'teacher', ['Do I work at a school?'], 'librarian cleaner childminder'),
    Q('kitchen', 'place', 'Do I work in a kitchen?', 'chef baker', ['Do I work in a restaurant kitchen?', 'Do I work in the kitchen?'], 'waiter'),
    Q('lab', 'place', 'Do I work in a lab?', 'scientist', ['Do I work in a laboratory?', 'Do I work in a lab or a laboratory?'], 'pharmacist doctor'),
    Q('studio', 'place', 'Do I work in a studio?', 'singer musician artist photographer youtuber actor', ['Do I work in a recording studio?', 'Do I work in a film studio?'], 'fashion author'),
    Q('home', 'place', 'Do I work from home?', 'author web youtuber', ['Can I work from home?', 'Do I work at home?', 'Do I work remotely?'], 'artist journalist photographer fashion childminder musician lawyer'),
    Q('vehicle', 'place', 'Do I work in a vehicle?', 'taxi driver pilot police fire paramedic attendant astronaut postal', ['Do I work in a car?', 'Do I work in a car or a truck?', 'Do I spend my day in a vehicle?'], 'farmer plumber electrician builder'),
    Q('stage', 'place', 'Do I perform in front of people?', 'actor singer musician footballer', ['Do I work on a stage?', 'Do I perform on a stage?', 'Do I perform in front of an audience?', 'Do I perform?'], 'teacher guide youtuber ceo lawyer'),
    Q('camera', 'place', 'Do I work in front of a camera?', 'actor youtuber', ['Do I appear on camera?', 'Do I appear on TV?', 'Do I appear in videos?'], 'journalist singer footballer'),
    // ---- body and clothes ----
    Q('uniform', 'body', 'Do I wear a uniform?', 'nurse police fire paramedic pilot attendant postal lifeguard footballer chef mechanic', ['Do I have to wear a uniform?', 'Do I wear a uniform for work?'], 'doctor waiter cleaner receptionist shop dentist physio pharmacist builder driver taxi plumber electrician baker'),
    Q('helmet', 'body', 'Do I wear a helmet?', 'fire builder astronaut', ['Do I wear a hard hat?', 'Do I wear a helmet or a hard hat?'], 'police electrician footballer'),
    Q('whitecoat', 'body', 'Do I wear a white coat?', 'doctor dentist vet scientist pharmacist', ['Do I wear white clothes?', 'Do I wear a white jacket?'], 'chef nurse physio baker'),
    Q('standing', 'body', 'Do I stand all day?', 'nurse teacher chef waiter hairdresser shop baker cleaner lifeguard builder farmer postal guide', ['Do I work standing up?', 'Do I stand up all day?', 'Do I stand up at work?', 'Do I stand up all day at work?', 'Do I work on my feet?'], 'doctor dentist vet police fire paramedic mechanic plumber electrician pharmacist physio childminder artist photographer'),
    Q('desk', 'body', 'Do I sit at a desk?', 'receptionist ceo lawyer web author journalist architect engineer', ['Do I work at a desk?', 'Do I sit at a desk all day?', 'Do I sit down all day?', 'Do I work sitting down?'], 'librarian teacher doctor scientist fashion artist pharmacist'),
    Q('strong', 'body', 'Do I need to be strong?', 'builder farmer fire footballer lifeguard postal paramedic astronaut police', ['Do I have to be strong?', 'Do I need to be fit?', 'Do I have to be fit?', 'Do I need to be strong and fit?'], 'plumber mechanic nurse physio baker cleaner electrician driver waiter'),
    Q('hands', 'body', 'Do I use my hands a lot?', 'dentist vet chef baker hairdresser builder mechanic plumber electrician farmer artist musician physio cleaner', ['Do I use my hands to work?', 'Do I work with my hands?', 'Do I use my hands all day?'], 'doctor nurse paramedic fashion photographer waiter postal'),
    Q('dirty', 'body', 'Do I get dirty at work?', 'builder farmer mechanic plumber cleaner', ['Do my hands get dirty?', 'Do I get my hands dirty?', 'Do I get dirty?', 'Are my hands often dirty?'], 'electrician chef baker vet artist fire'),
    // ---- people and animals ----
    Q('children', 'people', 'Do I work with children?', 'teacher childminder', ['Do I work with kids?', 'Do I work with young people?', 'Do I look after children?', 'Do I look after kids?'], 'nurse doctor dentist librarian driver author youtuber actor'),
    Q('sick', 'people', 'Do I help sick people?', 'doctor nurse paramedic physio pharmacist', ['Do I help ill people?', 'Do I look after sick people?', 'Do I help the sick?', 'Do I help patients?', 'Do I work with patients?'], 'dentist lifeguard'),
    Q('animals', 'people', 'Do I work with animals?', 'vet farmer', ['Do I look after animals?', 'Do I help animals?', 'Do I treat animals?'], 'police scientist photographer'),
    Q('talk', 'people', 'Do I talk to many people every day?', 'receptionist shop waiter teacher hairdresser nurse doctor attendant taxi guide pharmacist librarian lawyer journalist childminder paramedic dentist physio police', ['Do I talk to a lot of people every day?', 'Do I meet a lot of people?', 'Do I meet many people every day?', 'Do I talk to people all day?', 'Do I talk to customers?'], 'ceo driver postal singer youtuber actor'),
    Q('customers', 'people', 'Do I serve customers?', 'waiter shop baker pharmacist hairdresser', ['Do I help customers?', 'Do I work with customers?', 'Do I have customers?', 'Do I have clients?'], 'receptionist taxi cleaner'),
    Q('emergency', 'people', 'Do I help people in an emergency?', 'paramedic fire police doctor nurse lifeguard', ['Do I help people in emergencies?', 'Do I work in emergencies?', 'Do I deal with emergencies?'], 'pilot attendant pharmacist'),
    Q('lives', 'people', 'Do I save lives?', 'doctor nurse paramedic fire lifeguard', ['Do I save people’s lives?', 'Do I save people?', 'Can I save lives?'], 'police attendant pharmacist'),
    Q('safe', 'people', 'Do I keep people safe?', 'police fire lifeguard', ['Do I protect people?', 'Do I make people safe?', 'Do I look after people’s safety?'], 'paramedic attendant pilot doctor'),
    Q('passengers', 'people', 'Do I take people from one place to another?', 'taxi pilot', ['Do I take people to places?', 'Do I carry people?', 'Do I drive people around?', 'Do I take people from A to B?', 'Do I take passengers somewhere?', 'Do I have passengers?'], 'attendant driver paramedic'),
    Q('teach', 'people', 'Do I teach people?', 'teacher', ['Do I teach?', 'Do I teach children?', 'Do I teach students?', 'Do I help people learn?'], 'guide physio'),
    Q('law', 'people', 'Do I work with the law?', 'lawyer police', ['Do I work with laws?', 'Do I work in a court?', 'Do I go to court?'], 'journalist ceo'),
    // ---- tools and machines ----
    Q('computer', 'tools', 'Do I use a computer?', 'web ceo lawyer receptionist journalist author architect engineer youtuber librarian scientist photographer', ['Do I use a computer at work?', 'Do I use a computer every day?', 'Do I work on a computer?', 'Do I work with a computer?'], 'doctor nurse pharmacist teacher shop pilot mechanic musician artist fashion police farmer postal dentist'),
    Q('machines', 'tools', 'Do I use special machines?', 'pilot astronaut builder farmer mechanic engineer dentist driver taxi fire', ['Do I use machines?', 'Do I use big machines?', 'Do I work with machines?', 'Do I use special equipment?'], 'doctor paramedic scientist baker postal photographer'),
    Q('tools', 'tools', 'Do I use tools?', 'builder mechanic plumber electrician dentist farmer hairdresser chef baker artist', ['Do I need tools for my work?', 'Do I use tools for my work?', 'Do I need tools?', 'Do I use tools at work?', 'Do I use a lot of tools?'], 'doctor vet physio'),
    Q('drive', 'tools', 'Do I drive?', 'taxi driver postal', ['Do I drive a vehicle?', 'Do I drive at work?', 'Do I drive for work?', 'Do I drive a car?', 'Do I drive a lot?'], 'police fire paramedic farmer plumber electrician builder guide'),
    Q('fly', 'tools', 'Do I fly?', 'pilot astronaut attendant', ['Do I fly in a plane?', 'Do I fly planes?', 'Do I fly in the sky?', 'Do I work in the air?'], ''),
    Q('camerause', 'tools', 'Do I use a camera?', 'photographer youtuber', ['Do I use a camera at work?', 'Do I use a camera for work?', 'Do I take photos?', 'Do I take pictures?'], 'journalist actor'),
    Q('instrument', 'tools', 'Do I play an instrument?', 'musician', ['Do I play music?', 'Do I play an instrument for work?'], 'singer actor'),
    Q('scissors', 'tools', 'Do I use scissors or knives?', 'hairdresser chef baker fashion', ['Do I use knives?', 'Do I use scissors?', 'Do I use a knife?', 'Do I use scissors and knives?'], 'dentist doctor vet farmer'),
    // ---- what I do and make ----
    Q('make', 'what', 'Do I make or build things?', 'builder chef baker fashion artist web engineer', ['Do I make things?', 'Do I build things?', 'Do I build or make things?', 'Do I make things for people?', 'Do I make something?'], 'architect author photographer musician youtuber plumber electrician'),
    Q('repair', 'what', 'Do I repair things?', 'mechanic plumber electrician', ['Do I fix things?', 'Do I repair broken things?', 'Do I fix broken things?', 'Do I repair machines?'], 'builder engineer'),
    Q('design', 'what', 'Do I design things?', 'architect engineer fashion web artist', ['Do I draw designs?', 'Do I make designs?', 'Do I design?', 'Do I make plans?'], 'builder photographer'),
    Q('write', 'what', 'Do I write a lot?', 'author journalist lawyer', ['Do I write every day?', 'Do I write for work?', 'Do I write texts?', 'Do I write?'], 'teacher scientist singer web youtuber doctor ceo'),
    Q('food', 'what', 'Do I work with food?', 'chef baker waiter farmer', ['Do I make food?', 'Do I work with food every day?'], 'shop'),
    Q('cook', 'what', 'Do I cook?', 'chef baker', ['Do I cook food?', 'Do I cook for people?', 'Do I prepare food?', 'Do I cook meals?'], 'waiter'),
    Q('serve', 'what', 'Do I serve food?', 'waiter', ['Do I serve people food?', 'Do I serve meals?', 'Do I bring food to people?', 'Do I bring people food?'], 'chef'),
    Q('sell', 'what', 'Do I sell things?', 'shop baker pharmacist', ['Do I sell products?', 'Do I sell goods?', 'Do I sell things in a shop?'], 'waiter receptionist farmer ceo artist fashion'),
    Q('deliver', 'what', 'Do I deliver things?', 'postal driver', ['Do I deliver parcels?', 'Do I deliver letters?', 'Do I deliver packages?', 'Do I bring things to people?'], 'taxi baker'),
    Q('clean', 'what', 'Do I clean things?', 'cleaner', ['Do I clean?', 'Do I clean offices?', 'Do I clean houses?', 'Do I clean places?'], 'waiter childminder'),
    Q('medicine', 'what', 'Do I give people medicine?', 'doctor pharmacist', ['Do I give medicine?', 'Do I work with medicine?', 'Do I give out medicine?'], 'nurse vet paramedic dentist'),
    Q('sport', 'what', 'Do I play sports every day?', 'footballer', ['Do I play a sport?', 'Do I do sport every day?', 'Do I play sport?', 'Do I train every day?', 'Do I play football?', 'Do I do sports?'], 'lifeguard fire astronaut'),
    Q('sing', 'what', 'Do I sing?', 'singer', ['Do I sing songs?', 'Do I sing for work?'], 'musician actor'),
    Q('paint', 'what', 'Do I paint or draw?', 'artist', ['Do I paint?', 'Do I draw?', 'Do I draw pictures?', 'Do I paint pictures?'], 'fashion architect'),
    Q('act', 'what', 'Do I play characters?', 'actor', ['Do I act?', 'Do I play different characters?', 'Do I learn lines?', 'Do I play a character?'], 'youtuber singer'),
    Q('hair', 'what', 'Do I cut hair?', 'hairdresser', ['Do I cut people’s hair?', 'Do I do people’s hair?', 'Do I work with hair?'], ''),
    Q('teeth', 'what', 'Do I look after teeth?', 'dentist', ['Do I work with teeth?', 'Do I fix teeth?', 'Do I look after people’s teeth?'], ''),
    Q('fires', 'what', 'Do I put out fires?', 'fire', ['Do I fight fires?', 'Do I stop fires?', 'Do I work with fire?'], ''),
    Q('growfood', 'what', 'Do I grow food?', 'farmer', ['Do I grow vegetables?', 'Do I grow plants?', 'Do I grow things?', 'Do I grow crops?'], ''),
    Q('houses', 'what', 'Do I build houses?', 'builder', ['Do I build buildings?', 'Do I work on buildings?', 'Do I work on houses?'], 'architect engineer plumber electrician'),
    Q('experiments', 'what', 'Do I do experiments?', 'scientist', ['Do I make experiments?'], 'pharmacist doctor engineer'),
    Q('read', 'what', 'Do I work with books?', 'librarian author', ['Do I work with books every day?', 'Do I read books?', 'Do I give people books?'], 'teacher journalist'),
    // ---- skills and personality ----
    Q('creative', 'skills', 'Do I need to be creative?', 'artist fashion musician singer actor author architect photographer youtuber chef web hairdresser', ['Do I have to be creative?', 'Do I need to be very creative?', 'Do I need creative ideas?', 'Do I need to have good ideas?', 'Am I creative?'], 'journalist teacher engineer baker scientist'),
    Q('brave', 'skills', 'Do I need to be brave?', 'fire police paramedic lifeguard astronaut', ['Do I have to be brave?', 'Do I need to be very brave?', 'Do I need courage?', 'Am I brave?'], 'pilot doctor nurse footballer'),
    Q('patient', 'skills', 'Do I need to be patient?', 'teacher childminder nurse physio vet farmer', ['Do I have to be patient?', 'Do I need patience?', 'Do I need to be very patient?', 'Am I patient?'], 'doctor hairdresser taxi artist scientist receptionist waiter shop cleaner dentist'),
    Q('friendly', 'skills', 'Do I need to be friendly?', 'receptionist waiter attendant shop guide hairdresser nurse childminder teacher', ['Do I have to be friendly?', 'Do I need to be nice to people?', 'Do I need to be polite?', 'Do I have to be polite?', 'Am I friendly?', 'Do I need good people skills?'], 'doctor taxi pharmacist dentist lawyer'),
    Q('maths', 'skills', 'Do I need to be good at math?', 'engineer architect scientist astronaut ceo', ['Do I need to be good with numbers?', 'Do I need math?', 'Do I use math?', 'Do I have to be good at math?', 'Do I need to be good at maths?', 'Do I use math at work?'], 'pilot web pharmacist builder shop electrician'),
    Q('languages', 'skills', 'Do I need to speak foreign languages?', 'attendant guide', ['Do I need foreign languages?', 'Do I need to speak other languages?', 'Do I speak foreign languages?', 'Do I speak many languages?', 'Do I need to speak another language?'], 'receptionist journalist pilot lawyer ceo scientist singer'),
    Q('stress', 'skills', 'Is my job stressful?', 'doctor nurse paramedic fire police pilot ceo lawyer journalist waiter chef astronaut', ['Is my job very stressful?', 'Is my work stressful?', 'Is it a stressful job?', 'Is my job full of stress?'], 'teacher shop'),
    Q('dangerous', 'skills', 'Is my job dangerous?', 'fire police astronaut lifeguard paramedic builder', ['Is my job very dangerous?', 'Is my work dangerous?', 'Is it a dangerous job?', 'Is it dangerous?', 'Is my job risky?'], 'pilot farmer electrician driver taxi footballer mechanic'),
    Q('new', 'skills', 'Is my job quite new?', 'web youtuber', ['Is my job new?', 'Is it a new job?', 'Is my job modern?', 'Is it a modern job?', 'Is my job very new?'], 'photographer physio'),
    // ---- time and travel ----
    Q('night', 'time', 'Do I work at night?', 'nurse paramedic fire police', ['Do I work during the night?', 'Do I work in the night?', 'Do I work nights?', 'Do I work at night time?'], 'doctor pilot attendant baker taxi cleaner waiter chef driver singer musician'),
    Q('weekend', 'time', 'Do I work on weekends?', 'nurse paramedic fire police doctor chef waiter shop footballer farmer lifeguard singer musician actor attendant pilot guide taxi baker hairdresser', ['Do I work at weekends?', 'Do I work on the weekend?', 'Do I work at the weekend?', 'Do I work on Saturdays and Sundays?', 'Do I work on Saturdays?', 'Do I work on Sundays?', 'Do I work every weekend?'], 'vet dentist librarian builder plumber electrician postal mechanic cleaner youtuber photographer journalist author childminder driver'),
    Q('early', 'time', 'Do I start work very early?', 'baker farmer postal', ['Do I start work early in the morning?', 'Do I start early?', 'Do I get up very early?', 'Do I work early in the morning?', 'Do I start work early?'], 'cleaner driver teacher builder taxi'),
    Q('shifts', 'time', 'Do I work in shifts?', 'nurse paramedic police fire pilot attendant receptionist driver', ['Do I work shifts?', 'Do I have shifts?', 'Do I work different shifts?'], 'doctor waiter chef shop cleaner lifeguard taxi baker postal'),
    Q('travel', 'time', 'Do I travel a lot?', 'pilot attendant astronaut driver footballer singer musician guide', ['Do I travel for work?', 'Do I travel?', 'Do I travel a lot for work?', 'Do I travel all the time?', 'Do I travel around the world?'], 'actor ceo journalist photographer youtuber taxi scientist engineer'),
    Q('team', 'time', 'Do I work in a team?', 'doctor nurse police fire paramedic pilot footballer actor builder chef waiter astronaut attendant singer musician engineer web lifeguard', ['Do I work with a team?', 'Do I work with other people?', 'Do I work in a group?', 'Do I work as a team?', 'Do I have a team?'], 'dentist teacher mechanic shop baker scientist ceo electrician plumber journalist'),
    Q('vacation', 'time', 'Do I have long summer vacations?', 'teacher', ['Do I have long vacations?', 'Do I have a long summer vacation?', 'Do I have long holidays?', 'Do I have a long holiday in summer?', 'Do I have long summer holidays?'], 'footballer childminder'),
  ];

  return { JOBS, QUESTIONS };
})();
