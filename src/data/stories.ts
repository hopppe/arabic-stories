interface Story {
  id: string;
  title: {
    english: string;
    arabic: string;
  };
  content: {
    english: string[];
    arabic: string[];
  };
}

export const stories: Story[] = [
  {
    id: "little-red-riding-hood",
    title: {
      english: "Little Red Riding Hood",
      arabic: "ذات الرداء الأحمر"
    },
    content: {
      english: [
        "Once upon a time, there was a sweet little girl. Her grandmother made her a red hood, so everyone called her Little Red Riding Hood.",
        "One day, her mother said, \"Take this basket of food to your grandmother. She is sick. Don't talk to strangers and go straight to her house.\"",
        "Little Red Riding Hood walked through the forest. On the way, she met a big bad wolf. He said, \"Where are you going, little girl?\"",
        "She said, \"To my grandmother's house. She is sick.\"",
        "The wolf smiled and said, \"I hope she feels better.\" Then he ran quickly to the grandmother's house.",
        "The wolf knocked on the door. The grandmother said, \"Who is it?\"",
        "The wolf made his voice soft and said, \"It's me, Little Red Riding Hood.\"",
        "The grandmother said, \"Come in.\"",
        "The wolf jumped in, locked the grandmother in the closet, and wore her clothes.",
        "Soon, Little Red Riding Hood arrived. She looked at her \"grandmother\" and said, \"Grandmother, what big eyes you have!\"",
        "The wolf said, \"All the better to see you with!\"",
        "She said, \"What big ears you have!\"",
        "He said, \"All the better to hear you with!\"",
        "She said, \"What big teeth you have!\"",
        "The wolf shouted, \"All the better to eat you with!\" and jumped out of the bed.",
        "Little Red Riding Hood screamed. A hunter nearby heard her. He ran inside, grabbed the wolf, and saved the girl and her grandmother.",
        "They were safe and happy. From that day, Little Red Riding Hood never talked to strangers again."
      ],
      arabic: [
        "كان يا مكان، فيه بنت صغيرة طيبة. جدتها خيطت لها رداء أحمر، وصاروا الناس يسموها \"ذات الرداء الأحمر\".",
        "يوم من الأيام، أمها قالت لها: \"خذي هالسلة فيها أكل، وودّيها للجدة، لأنها مريضة. لا تكلمي أحد، وروحي على طول عندها.\"",
        "ذات الرداء الأحمر مشيت في الغابة. في الطريق، قابلت ذيب كبير وشرير. قال لها: \"وين رايحة يا بنت؟\"",
        "قالت له: \"رايحة عند جدتي، هي تعبانة.\"",
        "الذيب ابتسم وقال: \"الله يشفيها.\" بعدين ركض بسرعة على بيت الجدة.",
        "الذيب دق الباب. الجدة قالت: \"مين؟\"",
        "الذيب غيّر صوته وقال: \"أنا ذات الرداء الأحمر.\"",
        "الجدة قالت: \"تفضلي.\"",
        "الذيب دخل بسرعة، وحبس الجدة في الدولاب، ولبس ثيابها.",
        "بعد شوي، وصلت ذات الرداء الأحمر. نظرت لجدتها وقالت: \"جدتي، ليه عيونك كبار؟\"",
        "قال الذيب: \"عشان أشوفك كويس!\"",
        "قالت: \"وليه أذنك كبار؟\"",
        "قال: \"عشان أسمعك كويس!\"",
        "قالت: \"وليه أسنانك كبار؟\"",
        "صرخ الذيب: \"عشان آكلك!\" وقفز من السرير.",
        "ذات الرداء الأحمر صرخت. وكان فيه صياد قريب سمع صوتها. دخل بسرعة، ومسك الذيب، وأنقذ البنت وجدتها.",
        "صاروا بأمان ومبسوطين. ومن يومها، ذات الرداء الأحمر ما كلمت الغرباء أبدًا."
      ]
    }
  },
  {
    id: "the-lost-phone",
    title: {
      english: "The Lost Phone",
      arabic: "الجوال الضايع"
    },
    content: {
      english: [
        "Sara was walking in the mall when she noticed her phone was missing.",
        "She looked around and asked a security guard for help.",
        "A kind man had already found it and turned it in.",
        "Sara smiled and thanked him."
      ],
      arabic: [
        "سارة كانت تمشي في المول ولحظت إن جوالها مو معاها.",
        "دورت حواليها وسألت رجل الأمن يساعدها.",
        "رجال طيب كان لاقيه وسلّمه.",
        "سارة ابتسمت وشكرته."
      ]
    }
  },
  {
    id: "three-little-pigs",
    title: {
      english: "The Three Little Pigs",
      arabic: "الخنازير الثلاثة"
    },
    content: {
      english: [
        "Once upon a time, there were three little pigs who decided to build houses on their own.",
        "The first pig built a house of straw because it was easy and quick.",
        "The second pig built a house of wood, which was a bit stronger than straw.",
        "The third pig worked hard and built a strong house of bricks.",
        "A big bad wolf came to the first pig's house and said, \"I'll huff and I'll puff and I'll blow your house down!\"",
        "The wolf blew strongly, and the straw house collapsed. The first pig ran to his brother's wooden house.",
        "The wolf followed and blew down the wooden house too. Both pigs ran to their brother's brick house.",
        "The wolf tried to blow down the brick house, but it was too strong. He became very angry.",
        "The wolf decided to enter through the chimney. As he climbed down, he fell into a pot of boiling water.",
        "The wolf screamed and ran away, never to return again.",
        "The three pigs lived happily and safely after that, and they learned that hard work brings good results."
      ],
      arabic: [
        "كان يا مكان، فيه ثلاثة خنازير صغار قرروا يبنوا بيوت لحالهم.",
        "الخنزير الأول بنى بيت من القش لأنه سهل وسريع.",
        "الخنزير الثاني بنى بيت من الخشب، وكان أقوى شوية من القش.",
        "الخنزير الثالث تعب كثير وبنى بيت قوي من الطوب.",
        "جاء ذئب كبير وشرير لبيت الخنزير الأول وقال: \"رح أنفخ وأنفخ وأهد بيتك!\"",
        "نفخ الذئب بقوة، وطار بيت القش. هرب الخنزير الأول إلى بيت أخيه الخشبي.",
        "لحقهم الذئب ونفخ بيت الخشب كمان. هرب الخنزيران إلى بيت أخيهم الطوبي.",
        "حاول الذئب ينفخ بيت الطوب، لكن ما قدر. كان البيت قوي جدًا. غضب الذئب كثير.",
        "قرر الذئب يدخل من المدخنة. لما نزل، وقع في قدر ماء مغلي.",
        "صرخ الذئب وهرب، ولم يعد أبدًا.",
        "عاش الخنازير الثلاثة بسعادة وأمان بعد ذلك، وتعلموا أن العمل الجاد يؤتي ثماره."
      ]
    }
  },
  {
    id: "story-of-adam",
    title: {
      english: "The Story of Adam",
      arabic: "قصة آدم"
    },
    content: {
      english: [
        "In the beginning of creation, Allah created Adam from clay. He breathed into him from His Spirit, so he became human.",
        "Allah taught him all the names, then commanded the angels to prostrate to him. They all prostrated except Iblis (Satan).",
        "Iblis became arrogant and said, \"I am better than him. You created me from fire and created him from clay.\"",
        "Allah was angry with Iblis and expelled him from His mercy. Then He made Adam live in Paradise and created for him his wife Eve to live with her.",
        "Allah said to them, \"Eat from Paradise as you wish, but do not approach this tree.\" But Iblis whispered to them, so they ate from the tree. They disobeyed Allah.",
        "So Allah sent them down to earth and said to them, \"Live in it and repent to Me.\" Adam repented, and Allah forgave him.",
        "Adam was the first human and the first prophet. From him began the life of mankind."
      ],
      arabic: [
        "في بداية الخلق، خلق الله آدم من طين. ونفخ فيه من روحه، فصار إنسانًا.",
        "علّمه الله الأسماء كلها، ثم أمر الملائكة أن يسجدوا له. سجدوا كلهم إلا إبليس.",
        "تكبر إبليس وقال: \"أنا خير منه، خلقتني من نار وخلقته من طين.\"",
        "غضب الله على إبليس وطرده من رحمته. ثم أسكن آدم في الجنة، وخلق له زوجته حواء ليعيش معها.",
        "قال الله لهما: \"كلا من الجنة كما تشاءان، لكن لا تقربا هذه الشجرة.\" ولكن إبليس وسوس لهما، فأكلا من الشجرة. فعصيا الله.",
        "فأنزلهما الله إلى الأرض، وقال لهما: \"عيشوا فيها، وتوبوا إليّ.\" فتاب آدم، وغفر الله له.",
        "آدم كان أول إنسان، وأول نبي. ومنه بدأت حياة البشر."
      ]
    }
  },
  {
    id: "story-of-jesus",
    title: {
      english: "The Story of Jesus",
      arabic: "قصة يسوع"
    },
    content: {
      english: [
        "In ancient times, God sent an angel to Mary. The angel said to her: \"You are blessed, and God has chosen you. You will give birth to a boy, and you will name him Jesus. He will be the Son of God.\"",
        "Mary was surprised, and said: \"How can this be?\"",
        "The angel said: \"The Holy Spirit will come upon you, and the power of God will cover you. That's why the baby will be holy.\"",
        "Mary believed in the words of the angel. After a while, she traveled with Joseph to Bethlehem. There, Jesus was born in a simple manger, because there was no place in the inn.",
        "Shepherds in the field saw an angel, and he said to them: \"Born for you is a Savior, he is the Christ!\" And they came to see the child, and rejoiced greatly.",
        "Jesus grew up, and became a teacher of the people about the love of God. He healed the sick, forgave sins, and performed many miracles.",
        "Then, many people didn't like his words, so they seized him, and crucified him on a cross. He died, and was buried in a tomb.",
        "But after three days, he rose from the dead. He appeared to his disciples, and said to them: \"I am alive, and go teach all the people about me.\"",
        "This is Jesus, the Savior who loves all people, and came to give them eternal life."
      ],
      arabic: [
        "في زمان قديم، الله أرسل ملاك لمريم. الملاك قال لها: \"أنتِ مباركة، والله اختارك. راح تولدي ولد، وتسميه يسوع. هو بيكون ابن الله.\"",
        "مريم استغربت، وقالت: \"كيف يصير كده؟\"",
        "الملاك قال: \"الروح القدس بيجي عليك، وقوة الله تغطيك. عشان كده المولود بيكون قدوس.\"",
        "مريم آمنت بكلام الملاك. بعد وقت، سافرت مع يوسف لبيت لحم. هناك، يسوع اتولد في مزود بسيط، لأن ما كان فيه مكان في الفندق.",
        "رعاة في الحقل شافوا ملاك، وقال لهم: \"اتولد لكم مخلّص، هو المسيح!\" وجم يشوفوا الطفل، وفرحوا كثير.",
        "يسوع كبر، وصار يعلّم الناس عن محبة الله. شفى المرضى، وغفر الخطايا، وعمل معجزات كثيرة.",
        "بعدين، ناس كثير ما عجبهم كلامه، فمسكوه، وصلبوه على خشبة. مات، واندفن في قبر.",
        "لكن بعد ثلاثة أيام، قام من الموت. ظهر لتلاميذه، وقال لهم: \"أنا حي، وروحوا علّموا كل الناس عني.\"",
        "هذا هو يسوع، المخلّص اللي يحب كل الناس، وجاء يعطيهم حياة أبدية."
      ]
    }
  }
];

// Helper function to split Arabic text into words
export const splitArabicText = (text: string): string[] => {
  // Arabic text needs special handling for proper word splitting
  return text.split(/\s+/);
}; 