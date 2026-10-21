// Witch hunt (CLIL, [wh-who:R] and witch-guess.js): the yes / no questions of the game "Who am I?" (a Guess who with the 20 characters).
// q: the question as it is written in the book and as the computer suggests it. forms: other ways to say it that the computer accepts.
// yes: the characters (ids of witch-data.js; lord1 = both lords, farmerM1 = both male farmers) for whom the answer is YES; for all the others it is NO.
// aux: how the computer answers: be → "Yes, you are." · do → "Yes, you do." · does → "Yes, it does." · can → "Yes, you can." · did → "Yes, he did."
// group: who (who am I?) · do (what do I do?) · power (money and power): these three are printed in the book; more: only the computer knows them.

window.WITCH_QUESTIONS = (() => {
  const MEN = ['bishop', 'lord1', 'squire', 'monk', 'merchantM', 'blacksmith', 'craftsman', 'innkeeperM', 'farmerM1', 'beggar'];
  const WOMEN = ['noblewoman', 'maid', 'merchantF', 'herbalist', 'healer', 'midwife', 'farmerF', 'nun', 'innkeeperF', 'spinner'];
  const CHURCH = ['bishop', 'monk', 'nun'];
  const NOBLE = ['lord1', 'squire', 'noblewoman'];
  const PEOPLE = [...MEN, ...WOMEN].filter(id => !CHURCH.includes(id) && !NOBLE.includes(id));
  const Q = (id, group, aux, q, yes, forms = []) => ({ id, group, aux, q, yes, forms });
  return [
    // ---- who am I? ----
    Q('man', 'who', 'be', 'Am I a man?', MEN, ['Am I male?', 'Am I a male?']),
    Q('woman', 'who', 'be', 'Am I a woman?', WOMEN, ['Am I female?', 'Am I a female?']),
    Q('noble', 'who', 'be', 'Am I noble?', NOBLE, ['Am I a noble?', 'Am I part of the nobility?', 'Am I from the nobility?']),
    Q('church', 'who', 'be', 'Am I part of the Church?', CHURCH, ['Am I in the Church?', 'Am I from the Church?']),
    Q('working', 'who', 'be', 'Am I a working person?', PEOPLE, ['Am I a worker?', 'Am I one of the working people?', 'Am I part of the working people?']),
    Q('rich', 'who', 'be', 'Am I rich?', ['bishop', 'lord1', 'noblewoman', 'merchantM', 'merchantF'], ['Am I a rich person?']),
    Q('poor', 'who', 'be', 'Am I poor?', ['beggar', 'farmerM1', 'farmerF', 'maid', 'midwife', 'nun', 'spinner'], ['Am I a poor person?']),
    Q('young', 'who', 'be', 'Am I young?', ['squire']),
    // ---- what do I do? ----
    Q('hands', 'do', 'do', 'Do I work with my hands?', ['monk', 'blacksmith', 'craftsman', 'innkeeperM', 'farmerM1', 'maid', 'herbalist', 'healer', 'midwife', 'farmerF', 'innkeeperF', 'spinner'], ['Do I use my hands to work?']),
    Q('fields', 'do', 'do', 'Do I work in the fields?', ['farmerM1', 'farmerF'], ['Do I work on the land?']),
    Q('food', 'do', 'do', 'Do I grow food?', ['farmerM1', 'farmerF'], ['Do I grow vegetables?']),
    Q('pray', 'do', 'do', 'Do I pray every day?', CHURCH, ['Do I pray?']),
    Q('books', 'do', 'do', 'Do I copy books?', ['monk'], ['Do I copy books by hand?']),
    Q('sick', 'do', 'do', 'Do I help sick people?', ['monk', 'herbalist', 'healer', 'midwife', 'nun'], ['Do I help the sick?', 'Do I look after sick people?']),
    Q('medicine', 'do', 'do', 'Do I make medicines?', ['monk', 'herbalist', 'healer'], ['Do I make medicine?']),
    Q('birth', 'do', 'do', 'Do I help women give birth?', ['healer', 'midwife'], ['Do I help with births?']),
    Q('iron', 'do', 'do', 'Do I work with iron?', ['blacksmith'], ['Do I work with metal?', 'Do I make things from iron?']),
    Q('things', 'do', 'do', 'Do I make things?', ['blacksmith', 'craftsman', 'spinner'], ['Do I make objects?']),
    Q('thread', 'do', 'do', 'Do I make thread?', ['spinner'], ['Do I make thread from wool?']),
    Q('inn', 'do', 'do', 'Do I work in an inn?', ['innkeeperM', 'innkeeperF'], ['Do I work in a tavern?']),
    Q('sell', 'do', 'do', 'Do I buy and sell goods?', ['merchantM', 'merchantF'], ['Do I sell goods?', 'Do I sell things?']),
    Q('secrets', 'do', 'do', 'Do I listen to secrets?', ['innkeeperM', 'innkeeperF', 'maid'], ['Do I hear secrets?', 'Do I hear everything?']),
    Q('beg', 'do', 'do', 'Do I ask people for money?', ['beggar'], ['Do I beg?', 'Do I ask for money?']),
    Q('fight', 'do', 'do', 'Do I learn to fight?', ['squire'], ['Do I train to be a knight?']),
    // ---- money and power ----
    Q('land', 'power', 'do', 'Do I own land?', ['bishop', 'lord1', 'noblewoman'], ['Do I have land?', 'Do I own the land?']),
    Q('paytax', 'power', 'do', 'Do I pay taxes?', ['merchantM', 'blacksmith', 'craftsman', 'innkeeperM', 'farmerM1', 'maid', 'merchantF', 'herbalist', 'healer', 'midwife', 'farmerF', 'innkeeperF', 'spinner'], ['Do I pay tax?']),
    Q('collect', 'power', 'do', 'Do I collect taxes?', ['bishop', 'lord1'], ['Do I take taxes?', 'Do I collect tax?']),
    Q('castle', 'power', 'do', 'Do I live in a castle?', NOBLE),
    Q('vote', 'power', 'does', 'Does my vote count more than one?', ['bishop', 'lord1'], ['Does my vote count more?', 'Is my vote worth more than one?']),
    // ---- more questions (group 'more': they are NOT printed in the book; many come from the amazing facts and the cards) ----
    Q('night', 'more', 'do', 'Do I work at night?', ['monk', 'nun', 'midwife', 'innkeeperM', 'innkeeperF'], ['Do I work during the night?', 'Do I work in the night?']),
    Q('tools', 'more', 'do', 'Do I need tools for my work?', ['blacksmith', 'craftsman', 'farmerM1', 'farmerF', 'spinner'], ['Do I use tools?', 'Do I need tools?', 'Do I use tools for my work?']),
    Q('outside', 'more', 'do', 'Do I work outside?', ['farmerM1', 'farmerF', 'merchantM', 'merchantF', 'herbalist'], ['Do I work outdoors?']),
    Q('travel', 'more', 'do', 'Do I travel on dangerous roads?', ['merchantM', 'merchantF'], ['Do I travel a lot?', 'Do I travel?']),
    Q('animals', 'more', 'do', 'Do I work with animals?', ['farmerM1', 'farmerF'], ['Do I look after animals?', 'Do I keep animals?']),
    Q('sunrise', 'more', 'do', 'Do I work from sunrise to sunset?', ['farmerM1', 'farmerF'], ['Do I work all day?', 'Do I work from morning to night?']),
    Q('teach', 'more', 'do', 'Do I teach children?', ['nun', 'monk'], ['Do I teach?']),
    Q('beer', 'more', 'do', 'Do I make beer?', ['monk'], ['Do I brew beer?']),
    Q('furniture', 'more', 'do', 'Do I make furniture or shoes?', ['craftsman'], ['Do I make shoes?', 'Do I make furniture?', 'Do I make barrels?']),
    Q('horseshoes', 'more', 'do', 'Do I make horseshoes?', ['blacksmith'], ['Do I make horseshoes and nails?', 'Do I make nails?']),
    Q('guild', 'more', 'do', 'Do I belong to a guild?', ['craftsman'], ['Am I in a guild?', 'Am I part of a guild?']),
    Q('business', 'more', 'do', 'Do I have a business?', ['merchantM', 'merchantF', 'blacksmith', 'craftsman', 'innkeeperM', 'innkeeperF'], ['Do I run a business?', 'Do I have my own business?']),
    Q('plants', 'more', 'do', 'Do I know a lot about plants?', ['herbalist', 'healer'], ['Do I know about plants?', 'Do I use plants?']),
    Q('familysecrets', 'more', 'do', 'Do I know the secrets of every family?', ['midwife', 'innkeeperM', 'innkeeperF'], ['Do I know the secrets of the families?']),
    Q('outdoors', 'more', 'do', 'Do I sleep outside?', ['beggar'], ['Do I sleep outdoors?', 'Do I sleep in the street?']),
    Q('convent', 'more', 'do', 'Do I live in a convent?', ['nun']),
    Q('monastery', 'more', 'do', 'Do I live in a monastery?', ['monk']),
    Q('armour', 'more', 'do', 'Do I wear armour?', ['squire'], ['Do I wear armor?']),
    Q('widow', 'more', 'be', 'Am I often a widow?', ['merchantF', 'innkeeperF'], ['Am I a widow?']),
    // from the amazing facts
    Q('court', 'more', 'they', 'Can a normal court judge me?', ['lord1', 'squire', 'noblewoman', 'merchantM', 'blacksmith', 'craftsman', 'innkeeperM', 'farmerM1', 'beggar', 'maid', 'merchantF', 'herbalist', 'healer', 'midwife', 'farmerF', 'innkeeperF', 'spinner'], ['Can a normal court judge me?', 'Can normal courts judge me?']),
    Q('interdict', 'more', 'can', 'Can I close all the churches of a city?', ['bishop'], ['Can I close the churches of a city?', 'Can I close all the churches in a city?']),
    Q('married', 'more', 'can', 'Can I get married?', ['lord1', 'squire', 'noblewoman', 'merchantM', 'blacksmith', 'craftsman', 'innkeeperM', 'farmerM1', 'beggar', 'maid', 'merchantF', 'herbalist', 'healer', 'midwife', 'farmerF', 'innkeeperF', 'spinner'], ['Can I marry?']),
    Q('father', 'more', 'did', 'Did my father choose my husband?', ['noblewoman'], ['Did my father choose my husband for me?']),
    Q('inherit', 'more', 'do', 'Do I pay money to inherit land?', ['lord1'], ['Do I pay to inherit land?', 'Do I pay to inherit the land?']),
    Q('harvest', 'more', 'do', 'Do I give part of my harvest to the Lord?', ['farmerM1', 'farmerF'], ['Do I give the Lord part of my harvest?', 'Do I pay rent to the Lord?']),
    Q('freecity', 'more', 'can', 'Can I become free in a city?', ['farmerM1', 'farmerF'], ['Can I become free if I live in a city?', 'Can I be free in a city?']),
    Q('accuse', 'more', 'they', 'Can people easily accuse me of witchcraft?', ['herbalist', 'healer', 'midwife', 'merchantF', 'innkeeperF'], ['Can people accuse me of witchcraft?', 'Could people easily accuse me of witchcraft?', 'Am I easy to accuse of witchcraft?']),
  ];
})();
