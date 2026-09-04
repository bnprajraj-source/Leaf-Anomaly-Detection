const DISEASES = [
  {
    id: 'healthy',
    name: 'Healthy Leaf',
    nameHi: 'स्वस्थ पत्ता',
    icon: '🟢',
    color: '#22c55e',
    colorClass: 'leaf',
    severity: 'None',
    severityHi: 'कोई नहीं',
    category: 'Healthy',
    categoryHi: 'स्वस्थ',
    description: 'A healthy leaf shows uniform green coloration, firm texture, and no visible spots, discoloration, or deformities. Healthy leaves are the baseline for comparison.',
    descriptionHi: 'एक स्वस्थ पत्ता समान हरा रंग, सख्त बनावट, और कोई दिखाई देने वाले धब्बे, रंग बदलना, या विकृति नहीं दिखाता। स्वस्थ पत्ते तुलना का आधार होते हैं।',
    symptoms: [
      'Uniform green color across the leaf surface',
      'Firm, turgid texture',
      'No spots, lesions, or discoloration',
      'Normal leaf shape and size',
      'Intact veins and margins',
    ],
    symptomsHi: [
      'पत्ते की सतह पर समान हरा रंग',
      'सख्त, तना हुआ बनावट',
      'कोई धब्बे, घाव, या रंग बदलना नहीं',
      'सामान्य पत्ते का आकार और आकार',
      'अखंड शिराएं और किनारे',
    ],
    causes: [
      'Proper nutrition and watering',
      'Adequate sunlight exposure',
      'Good soil drainage',
      'Absence of pathogens and pests',
    ],
    causesHi: [
      'उचित पोषण और सिंचाई',
      'पर्याप्त सूर्यप्रकाश एक्सपोज़र',
      'अच्छी मिट्टी की जल निकासी',
      'रोगजनकों और कीटों की अनुपस्थिति',
    ],
    treatment: [
      'Continue regular watering and fertilization schedule',
      'Monitor for early signs of disease',
      'Maintain good air circulation around plants',
      'Practice crop rotation to prevent soil-borne diseases',
    ],
    treatmentHi: [
      'नियमित सिंचाई और उर्वरक कार्यक्रम जारी रखें',
      'रोग के शुरुआती संकेतों की निगरानी करें',
      'पौधों के चारों ओर अच्छा वायु परिसंचरण बनाए रखें',
      'मिट्टी जनित रोगों को रोकने के लिए फसल चक्र अपनाएं',
    ],
    prevention: [
      'Regular inspection of plant health',
      'Balanced fertilization program',
      'Proper spacing between plants',
      'Maintain optimal soil pH (6.0-7.0)',
    ],
    preventionHi: [
      'पौधों के स्वास्थ्य का नियमित निरीक्षण',
      'संतुलित उर्वरक कार्यक्रम',
      'पौधों के बीच उचित दूरी',
      'इष्टतम मिट्टी pH (6.0-7.0) बनाए रखें',
    ],
    affectedCrops: ['All plant species'],
    affectedCropsHi: ['सभी पौधों की प्रजातियां'],
    favorableConditions: 'Optimal temperature 20-30°C, adequate moisture, balanced nutrients',
    favorableConditionsHi: 'इष्टतम तापमान 20-30°C, पर्याप्त नमी, संतुलित पोषक तत्व',
    faq: [
      { q: 'How do I know if my leaf is truly healthy?', a: 'Look for uniform green color, firm texture, no spots or holes, and normal size for the species.' },
      { q: 'Can healthy leaves develop diseases later?', a: 'Yes. Environmental stress, new pathogen exposure, or nutrient deficiencies can cause previously healthy leaves to develop diseases.' },
    ],
    faqHi: [
      { q: 'मैं कैसे जानूं कि मेरा पत्ता वास्तव में स्वस्थ है?', a: 'समान हरा रंग, सख्त बनावट, कोई धब्बे या छेद नहीं, और प्रजाति के लिए सामान्य आकार देखें।' },
      { q: 'क्या स्वस्थ पत्तों को बाद में रोग हो सकते हैं?', a: 'हां। पर्यावरणीय तनाव, नए रोगजनक के संपर्क, या पोषक तत्वों की कमी से पहले स्वस्थ पत्तों में रोग हो सकते हैं।' },
    ],
  },
  {
    id: 'leaf-spot',
    name: 'Leaf Spot',
    nameHi: 'पत्ता धब्बा',
    icon: '🟤',
    color: '#d97706',
    colorClass: 'amber',
    severity: 'Moderate to Severe',
    severityHi: 'मध्यम से गंभीर',
    category: 'Fungal / Bacterial',
    categoryHi: 'कवक / बैक्टीरिया',
    description: 'Leaf spot is a common plant disease characterized by round or irregular brown, black, or yellow spots on leaves. It is caused by various fungi and bacteria and can significantly reduce photosynthetic capacity.',
    descriptionHi: 'पत्ता धब्बा एक सामान्य पौधा रोग है जो पत्तों पर गोल या अनियमित भूरे, काले, या पीले धब्बों से विशेषता रखता है। यह विभिन्न कवकों और बैक्टीरिया से होता है और प्रकाश संश्लेषण क्षमता को काफी कम कर सकता है।',
    symptoms: [
      'Circular or irregular brown/dark spots on leaf surface',
      'Spots may have yellow halos around them',
      'Spots can merge causing larger necrotic areas',
      'Premature leaf drop in severe infections',
      'Reduced photosynthetic efficiency',
      'Spots may appear water-soaked initially',
    ],
    symptomsHi: [
      'पत्ते की सतह पर गोल या अनियमित भूरे/गहरे धब्बे',
      'धब्बों के चारों ओर पीले घेरे हो सकते हैं',
      'धब्बे मिलकर बड़े नेक्रोटिक क्षेत्र बना सकते हैं',
      'गंभीर संक्रमण में समय से पहले पत्ते गिरना',
      'प्रकाश संश्लेषण दक्षता में कमी',
      'शुरुआत में धब्बे पानी में भीगे हुए दिख सकते हैं',
    ],
    causes: [
      'Fungal pathogens: Cercospora, Septoria, Alternaria',
      'Bacterial pathogens: Xanthomonas, Pseudomonas',
      'Overhead watering splash dispersing spores',
      'High humidity and warm temperatures',
      'Poor air circulation',
    ],
    causesHi: [
      'कवक रोगजनक: सर्कोस्पोरा, सेप्टोरिया, अल्टरनेरिया',
      'बैक्टीरियल रोगजनक: जैंथोमोनास, प्यूडोमोनास',
      'ऊपर से सिंचाई से बौछार फैलना वाले बीजाणु',
      'उच्च आर्द्रता और गर्म तापमान',
      'खराब वायु परिसंचरण',
    ],
    treatment: [
      'Remove and destroy infected leaves immediately',
      'Apply fungicide (chlorothalonil or copper-based) at first sign',
      'Improve air circulation by pruning dense foliage',
      'Switch to drip irrigation to reduce leaf wetness',
      'Apply neem oil as organic alternative',
    ],
    treatmentHi: [
      'संक्रमित पत्तों को तुरंत हटाएं और नष्ट करें',
      'पहले संकेत पर कवकनाशी (क्लोरोथैलोनिल या तांबा आधारित) लगाएं',
      'घनी पत्तियों की छंटाई से वायु परिसंचरण में सुधार करें',
      'पत्ते की नमी कम करने के लिए ड्रिप सिंचाई पर स्विच करें',
      'जैविक विकल्प के रूप में नीम का तेल लगाएं',
    ],
    prevention: [
      'Avoid overhead watering',
      'Maintain proper plant spacing (12-18 inches)',
      'Clean pruning tools between plants',
      'Apply preventive fungicide in wet seasons',
      'Remove plant debris at end of season',
    ],
    preventionHi: [
      'ऊपर से सिंचाई से बचें',
      'पौधों के बीच उचित दूरी (12-18 इंच) बनाए रखें',
      'पौधों के बीच छंटाई उपकरण साफ करें',
      'गीले मौसम में निवारक कवकनाशी लगाएं',
      'मौसम के अंत में पौधों के मलबे को हटाएं',
    ],
    affectedCrops: ['Tomato', 'Pepper', 'Lettuce', 'Rose', 'Dogwood', 'Holly', 'Corn'],
    affectedCropsHi: ['टमाटर', 'मिर्च', 'लेट्यूस', 'गुलाब', 'डॉगवुड', 'हॉली', 'मक्का'],
    favorableConditions: 'Warm (20-28°C), humid conditions with frequent rainfall or overhead irrigation',
    favorableConditionsHi: 'गर्म (20-28°C), बार-बार वर्षा या ऊपर से सिंचाई के साथ आर्द्र परिस्थितियां',
    faq: [
      { q: 'Are leaf spots contagious to other plants?', a: 'Yes, fungal leaf spots can spread through water splash, wind, contaminated tools, and insect vectors. Remove infected material promptly.' },
      { q: 'Can leaf spots kill a plant?', a: 'Severe infections can cause significant defoliation, weakening the plant. While rarely fatal alone, it makes plants vulnerable to secondary infections and environmental stress.' },
    ],
    faqHi: [
      { q: 'क्या पत्ते के धब्बे अन्य पौधों में फैलते हैं?', a: 'हां, कवक पत्ता धब्बे पानी की बौछार, हवा, दूषित उपकरणों और कीट वाहकों से फैल सकते हैं। संक्रमित सामग्री को तुरंत हटाएं।' },
      { q: 'क्या पत्ते के धब्बे पौधे को मार सकते हैं?', a: 'गंभीर संक्रमण महत्वपूर्ण पत्ता झड़ना का कारण बन सकते हैं, जिससे पौधा कमजोर होता है। यद्यपि अकेले घातक कम है, यह पौधों को माध्यमिक संक्रमण और पर्यावरणीय तनाव के प्रति संवेदनशील बनाता है।' },
    ],
  },
  {
    id: 'powdery-mildew',
    name: 'Powdery Mildew',
    nameHi: 'चूर्णिल फफूंद',
    icon: '⬜',
    color: '#9ca3af',
    colorClass: 'gray',
    severity: 'Moderate',
    severityHi: 'मध्यम',
    category: 'Fungal',
    categoryHi: 'कवक',
    description: 'Powdery mildew is a fungal disease that appears as a white to gray powdery coating on leaves, stems, and flowers. Unlike most fungi, it thrives in dry conditions with high humidity.',
    descriptionHi: 'चूर्णिल फफूंद एक कवक रोग है जो पत्तों, तनों और फूलों पर सफेद से भूरी चूर्णिल परत के रूप में दिखाई देता है। अधिकांश कवकों के विपरीत, यह उच्च आर्द्रता के साथ शुष्क परिस्थितियों में फलता-फूलता है।',
    symptoms: [
      'White/gray powdery coating on leaf surfaces',
      'Leaves may curl, yellow, or become distorted',
      'Stunted growth in young plants',
      'Premature leaf drop',
      'Reduced fruit quality and yield',
      'Powdery spots that expand over time',
    ],
    symptomsHi: [
      'पत्तों की सतह पर सफेद/भूरी चूर्णिल परत',
      'पत्ते मुड़ सकते हैं, पीले हो सकते हैं, या विकृत हो सकते हैं',
      'युवा पौधों में बौनापन',
      'समय से पहले पत्ते गिरना',
      'फल की गुणवत्ता और उपज में कमी',
      'समय के साथ फैलने वाले चूर्णिल धब्बे',
    ],
    causes: [
      'Fungi: Erysiphe, Podosphaera, Sphaerotheca species',
      'High humidity at night, dry days',
      'Poor air circulation',
      'Shaded or overcrowded plantings',
      'Excessive nitrogen fertilization',
    ],
    causesHi: [
      'कवक: एरिसिफे, पोडोस्फेरा, स्फेरोथेका प्रजातियां',
      'रात में उच्च आर्द्रता, शुष्क दिन',
      'खराब वायु परिसंचरण',
      'छायांकित या अत्यधिक भरे हुए रोपण',
      'अत्यधिक नाइट्रोजन उर्वरक',
    ],
    treatment: [
      'Apply potassium bicarbonate spray (1 tbsp per gallon)',
      'Use neem oil or sulfur-based fungicides',
      'Remove severely infected plant parts',
      'Improve air circulation through pruning',
      'Apply milk spray (40% milk to 60% water) as organic remedy',
    ],
    treatmentHi: [
      'पोटैशियम बाइकार्बोनेट स्प्रे लगाएं (1 बड़ा चम्मच प्रति गैलन)',
      'नीम का तेल या सल्फर आधारित कवकनाशी का उपयोग करें',
      'गंभीर रूप से संक्रमित पौधों के हिस्सों को हटाएं',
      'छंटाई के माध्यम से वायु परिसंचरण में सुधार करें',
      'जैविक उपचार के रूप में दूध स्प्रे लगाएं (40% दूध, 60% पानी)',
    ],
    prevention: [
      'Choose resistant cultivars when available',
      'Ensure adequate spacing for air circulation',
      'Avoid excessive nitrogen fertilization',
      'Prune to open up plant canopy',
      'Plant in full sunlight when possible',
    ],
    preventionHi: [
      'उपलब्ध होने पर प्रतिरोधी किस्में चुनें',
      'वायु परिसंचरण के लिए पर्याप्त दूरी सुनिश्चित करें',
      'अत्यधिक नाइट्रोजन उर्वरक से बचें',
      'पौधे की छतरी खोलने के लिए छंटाई करें',
      'जब संभव हो पूर्ण धूप में लगाएं',
    ],
    affectedCrops: ['Squash', 'Cucumber', 'Grapes', 'Roses', 'Wheat', 'Barley', 'Apple'],
    affectedCropsHi: ['कद्दू', 'खीरा', 'अंगूर', 'गुलाब', 'गेहूं', 'जौ', 'सेब'],
    favorableConditions: 'Moderate temperatures (15-28°C), high humidity, dry leaf surface conditions',
    favorableConditionsHi: 'मध्यम तापमान (15-28°C), उच्च आर्द्रता, शुष्क पत्ते की सतह की स्थिति',
    faq: [
      { q: 'Is powdery mildew harmful to humans?', a: 'No, powdery mildew fungi are specific to plants and do not infect humans or animals.' },
      { q: 'Can powdery mildew spread in dry weather?', a: 'Yes! Unlike most fungi, powdery mildew does not require free water on leaves. High humidity is sufficient for spore germination.' },
    ],
    faqHi: [
      { q: 'क्या चूर्णिल फफूंद मनुष्यों के लिए हानिकारक है?', a: 'नहीं, चूर्णिल फफूंद कवक पौधों के लिए विशिष्ट हैं और मनुष्यों या जानवरों को संक्रमित नहीं करते।' },
      { q: 'क्या शुष्क मौसम में चूर्णिल फफूंद फैल सकती है?', a: 'हां! अधिकांश कवकों के विपरीत, चूर्णिल फफूंद के लिए पत्तों पर मुक्त पानी की आवश्यकता नहीं होती। बीजाणु अंकुरण के लिए उच्च आर्द्रता पर्याप्त है।' },
    ],
  },
  {
    id: 'rust',
    name: 'Rust Disease',
    nameHi: 'रस्ट रोग',
    icon: '🟠',
    color: '#ea580c',
    colorClass: 'orange',
    severity: 'Moderate to Severe',
    severityHi: 'मध्यम से गंभीर',
    category: 'Fungal',
    categoryHi: 'कवक',
    description: 'Rust is a fungal disease named for the rusty orange-brown pustules it produces on leaves and stems. It can dramatically reduce crop yields and weaken plants significantly.',
    descriptionHi: 'रस्ट एक कवक रोग है जो पत्तों और तनों पर पैदा होने वाले जंग जैसे नारंगी-भूरे पुस्ट्यूल के लिए जाना जाता है। यह फसल की उपज को नाटकीय रूप से कम कर सकता है और पौधों को काफी कमजोर कर सकता है।',
    symptoms: [
      'Orange, yellow, or reddish-brown pustules on leaf undersides',
      'Yellow spots on upper leaf surfaces corresponding to pustules',
      'Premature leaf yellowing and dropping',
      'Reduced plant vigor and growth',
      'Stunted stems in severe infections',
      'Pustules rupture to release powdery spores',
    ],
    symptomsHi: [
      'पत्तों के नीचे नारंगी, पीले, या लाल-भूरे पुस्ट्यूल',
      'पुस्ट्यूल के अनुरूप पत्तों की ऊपरी सतह पर पीले धब्बे',
      'समय से पहले पत्ते पीले होना और गिरना',
      'पौधे की ऊर्जा और विकास में कमी',
      'गंभीर संक्रमण में तने बौने',
      'पुस्ट्यूल फूटकर चूर्णिल बीजाणु छोड़ते हैं',
    ],
    causes: [
      'Fungi: Puccinia, Uromyces, Melampsora species',
      'Cool, moist conditions promote infection',
      'Extended leaf wetness periods',
      'Alternate host plants nearby',
      'Wind-dispersed spores from infected fields',
    ],
    causesHi: [
      'कवक: पुसिनिया, यूरोमाइसेस, मेलाम्प्सोरा प्रजातियां',
      'ठंडी, गीली परिस्थितियां संक्रमण को बढ़ावा देती हैं',
      'लंबी पत्ते की नमी अवधि',
      'निकटतम में वैकल्पिक मेजबान पौधे',
      'संक्रमित खेतों से हवा द्वारा फैलने वाले बीजाणु',
    ],
    treatment: [
      'Apply sulfur-based fungicide at first pustule appearance',
      'Use systemic fungicides (triadimefon, propiconazole) for severe cases',
      'Remove and destroy infected leaves',
      'Remove alternate host plants from vicinity',
      'Apply iron-based fungicides as preventive measure',
    ],
    treatmentHi: [
      'पहले पुस्ट्यूल दिखने पर सल्फर आधारित कवकनाशी लगाएं',
      'गंभीर मामलों के लिए सिस्टमिक कवकनाशी (ट्रायडिमेफोन, प्रोपिकोनाज़ोल) का उपयोग करें',
      'संक्रमित पत्तों को हटाएं और नष्ट करें',
      'आसपास से वैकल्पिक मेजबान पौधों को हटाएं',
      'निवारक उपाय के रूप में लोहा आधारित कवकनाशी लगाएं',
    ],
    prevention: [
      'Plant resistant varieties',
      'Avoid overhead irrigation',
      'Maintain good plant nutrition (balanced NPK)',
      'Remove crop debris after harvest',
      'Monitor early in season for first pustule signs',
    ],
    preventionHi: [
      'प्रतिरोधी किस्में लगाएं',
      'ऊपर से सिंचाई से बचें',
      'अच्छे पौधे के पोषण बनाए रखें (संतुलित NPK)',
      'फसल कटाई के बाद फसल के मलबे को हटाएं',
      'मौसम की शुरुआत में पहले पुस्ट्यूल संकेतों की निगरानी करें',
    ],
    affectedCrops: ['Wheat', 'Barley', 'Coffee', 'Bean', 'Corn', 'Peach', 'Asparagus'],
    affectedCropsHi: ['गेहूं', 'जौ', 'कॉफी', 'बीन', 'मक्का', 'आड़ू', 'शतावरी'],
    favorableConditions: 'Cool (15-22°C), moist conditions with frequent dew or light rain',
    favorableConditionsHi: 'ठंडा (15-22°C), बार-बार ओस या हल्की बारिश के साथ गीली परिस्थितियां',
    faq: [
      { q: 'How fast does rust spread?', a: 'Under favorable conditions, rust can complete its life cycle in 7-14 days, leading to rapid epidemics that can devastate a crop within weeks.' },
      { q: 'Can rust survive winter?', a: 'Yes, rust fungi can survive as spores on crop debris, alternate hosts, or in soil during winter, reinfecting crops the following season.' },
    ],
    faqHi: [
      { q: 'रस्ट कितनी तेजी से फैलता है?', a: 'अनुकूल परिस्थितियों में, रस्ट 7-14 दिनों में अपना जीवन चक्र पूरा कर सकता है, जिससे तेजी से महामारी होती है जो हफ्तों में फसल को तबाह कर सकती है।' },
      { q: 'क्या रस्ट सर्दियों में जीवित रह सकता है?', a: 'हां, रस्ट कवक फसल के मलबे, वैकल्पिक मेजबानों, या सर्दियों में मिट्टी में बीजाणुओं के रूप में जीवित रह सकते हैं, अगले मौसम में फसलों को फिर से संक्रमित करते हैं।' },
    ],
  },
  {
    id: 'blight',
    name: 'Blight',
    nameHi: 'अंगमारी',
    icon: '⬛',
    color: '#dc2626',
    colorClass: 'red',
    severity: 'Severe',
    severityHi: 'गंभीर',
    category: 'Fungal / Bacterial',
    categoryHi: 'कवक / बैक्टीरिया',
    description: 'Blight refers to rapid and complete browning, wilting, and death of plant tissues. It can affect leaves, stems, flowers, and fruits, often causing devastating crop losses.',
    descriptionHi: 'अंगमारी पौधों के ऊतकों के तेज और पूर्ण भूरे होने, मुरझाने और मरने को संदर्भित करती है। यह पत्तों, तनों, फूलों और फलों को प्रभावित कर सकती है, अक्सर विनाशकारी फसल हानि का कारण बनती है।',
    symptoms: [
      'Rapid browning and death of leaf tissue',
      'Water-soaked lesions that expand quickly',
      'Complete leaf collapse and plant wilting',
      'Dark, sunken lesions on stems',
      'Fruit rot and decay',
      'Ring-shaped patterns of disease progression',
    ],
    symptomsHi: [
      'पत्ते के ऊतक का तेज भूरा होना और मरना',
      'तेजी से फैलने वाले पानी में भीगे घाव',
      'पत्ते का पूर्ण पतन और पौधे का मुरझाना',
      'तनों पर गहरे, गड्ढे वाले घाव',
      'फल सड़ना और सड़ना',
      'रोग प्रगति के गोलाकार पैटर्न',
    ],
    causes: [
      'Fungal: Phytophthora, Alternaria, Fusarium species',
      'Bacterial: Erwinia, Pseudomonas syringae',
      'Prolonged wet conditions',
      'Poor drainage and waterlogged soil',
      'Contaminated seeds or soil',
    ],
    causesHi: [
      'कवक: फाइटोफ्थोरा, अल्टरनेरिया, फ्यूजेरियम प्रजातियां',
      'बैक्टीरिया: एरविनिया, प्यूडोमोनास सिरिंजी',
      'लंबी गीली परिस्थितियां',
      'खराब जल निकासी और पानी से भरी मिट्टी',
      'दूषित बीज या मिट्टी',
    ],
    treatment: [
      'Remove and destroy all infected plant material immediately',
      'Apply copper-based bactericide for bacterial blight',
      'Use fungicides (mancozeb, chlorothalonil) for fungal blight',
      'Improve soil drainage',
      'Apply biological controls (Bacillus subtilis)',
    ],
    treatmentHi: [
      'सभी संक्रमित पौधे सामग्री को तुरंत हटाएं और नष्ट करें',
      'बैक्टीरियल अंगमारी के लिए तांबा आधारित बैक्टीरिसाइड लगाएं',
      'कवक अंगमारी के लिए कवकनाशी (मैंकोज़ेब, क्लोरोथैलोनिल) का उपयोग करें',
      'मिट्टी की जल निकासी में सुधार करें',
      'जैविक नियंत्रण (बैसिलस सब्टिलिस) लगाएं',
    ],
    prevention: [
      'Use certified disease-free seeds and transplants',
      'Ensure excellent soil drainage',
      'Rotate crops on a 3-4 year cycle',
      'Avoid working with wet plants (spreads pathogens)',
      'Apply mulch to prevent soil splash onto leaves',
    ],
    preventionHi: [
      'प्रमाणित रोग-मुक्त बीज और रोपाई का उपयोग करें',
      'उत्कृष्ट मिट्टी की जल निकासी सुनिश्चित करें',
      '3-4 साल के चक्र में फसलें बदलें',
      'गीले पौधों के साथ काम करने से बचें (रोगजनक फैलते हैं)',
      'पत्तों पर मिट्टी की बौछार रोकने के लिए मल्च लगाएं',
    ],
    affectedCrops: ['Potato', 'Tomato', 'Apple', 'Pear', 'Citrus', 'Onion', 'Bean'],
    affectedCropsHi: ['आलू', 'टमाटर', 'सेब', 'नाशपाती', 'संतरा', 'प्याज', 'बीन'],
    favorableConditions: 'Warm (20-30°C), wet conditions with prolonged leaf wetness or soil saturation',
    favorableConditionsHi: 'गर्म (20-30°C), लंबी पत्ते की नमी या मिट्टी संतृप्ति के साथ गीली परिस्थितियां',
    faq: [
      { q: 'Is blight the same as leaf spot?', a: 'No. Blight is more aggressive and causes rapid, large-scale tissue death. Leaf spots are typically smaller, localized lesions that develop more slowly.' },
      { q: 'Can blight be cured once it infects a plant?', a: 'Blight cannot be cured in already infected tissue, but it can be arrested with fungicides/bactericides to save the rest of the plant and prevent spread.' },
    ],
    faqHi: [
      { q: 'क्या अंगमारी पत्ता धब्बे जैसी ही है?', a: 'नहीं। अंगमारी अधिक आक्रामक है और तेज, बड़े पैमाने पर ऊतक मृत्यु का कारण बनती है। पत्ता धब्बे आमतौर पर छोटे, स्थानीयकृत घाव होते हैं जो धीरे-धीरे विकसित होते हैं।' },
      { q: 'क्या अंगमारी को एक बार पौधे में संक्रमित होने के बाद ठीक किया जा सकता है?', a: 'अंगमारी को पहले से संक्रमित ऊतक में ठीक नहीं किया जा सकता, लेकिन इसे कवकनाशी/बैक्टीरिसाइड से रोका जा सकता है ताकि पौधे का बाकी हिस्सा बचाया जा सके और फैलने से रोका जा सके।' },
    ],
  },
]

export const CHATBOT_RESPONSES = {
  greetings: {
    en: [
      'Hello! I\'m LeafScan AI assistant. I can help you identify and understand plant diseases. Ask me anything about leaf conditions!',
      'Hi there! Need help with plant disease identification? I\'m here to answer your questions about leaf health.',
      'Welcome! I can provide detailed information about common leaf diseases, their symptoms, treatments, and prevention. What would you like to know?',
    ],
    hi: [
      'नमस्ते! मैं LeafScan AI सहायक हूं। मैं पौधों के रोगों की पहचान करने और उन्हें समझने में आपकी मदद कर सकता हूं। पत्तों की स्थिति के बारे में कुछ भी पूछें!',
      'नमस्ते! क्या आपको पौधों के रोग की पहचान में मदद चाहिए? मैं पत्तों के स्वास्थ्य के बारे में आपके सवालों का जवाब देने के लिए यहां हूं।',
      'स्वागत है! मैं सामान्य पत्ता रोगों, उनके लक्षणों, उपचारों और रोकथाम के बारे में विस्तृत जानकारी प्रदान कर सकता हूं। आप क्या जानना चाहेंगे?',
    ],
  },
  fallback: {
    en: [
      'I\'m not sure about that specific query. I can help with: disease identification, symptoms, treatments, prevention, and affected crops. Try asking about a specific disease!',
      'That\'s outside my expertise area. I specialize in plant leaf diseases. You can ask about Healthy leaves, Leaf Spot, Powdery Mildew, Rust, or Blight.',
    ],
    hi: [
      'मुझे इस विशिष्ट प्रश्न के बारे में यकीन नहीं है। मैं इनमें मदद कर सकता हूं: रोग की पहचान, लक्षण, उपचार, रोकथाम, और प्रभावित फसलें। किसी विशिष्ट रोग के बारे में पूछने का प्रयास करें!',
      'यह मेरी विशेषज्ञता के क्षेत्र से बाहर है। मैं पत्ता रोगों में विशेषज्ञ हूं। आप स्वस्थ पत्ते, पत्ता धब्बा, चूर्णिल फफूंद, रस्ट, या अंगमारी के बारे में पूछ सकते हैं।',
    ],
  },
  quickActions: {
    en: [
      { label: 'All Diseases', query: 'What diseases can you detect?' },
      { label: 'Symptoms', query: 'What are the symptoms of leaf diseases?' },
      { label: 'Prevention', query: 'How to prevent plant diseases?' },
      { label: 'Treatments', query: 'How to treat plant diseases?' },
    ],
    hi: [
      { label: 'सभी रोग', query: 'What diseases can you detect?' },
      { label: 'लक्षण', query: 'What are the symptoms of leaf diseases?' },
      { label: 'रोकथाम', query: 'How to prevent plant diseases?' },
      { label: 'उपचार', query: 'How to treat plant diseases?' },
    ],
  },
  leafAnatomy: {
    en: {
      title: '🍃 Leaf Anatomy',
      content: `A leaf has several key parts:

**Blade (Lamina):** The flat, green part that performs photosynthesis.

**Petiole:** The stalk that attaches the leaf to the stem.

**Veins:** Transport water, nutrients, and sugars. They also provide structural support.

**Midrib:** The central main vein running through the leaf.

**Margin:** The edge of the leaf (smooth, serrated, lobed).

**Apex:** The tip of the leaf.

**Base:** The bottom part where the petiole attaches.

**Stomata:** Tiny pores on the underside for gas exchange.

**Cuticle:** Waxy protective layer on the surface.`,
    },
    hi: {
      title: '🍃 पत्ते की संरचना',
      content: `एक पत्ते में कई मुख्य भाग होते हैं:

**पत्ती (लैमिना):** सपाट, हरा भाग जो प्रकाश संश्लेषण करता है।

**पत्तृण:** वह तना जो पत्ते को तने से जोड़ता है।

**शिराएं:** पानी, पोषक तत्वों और शर्करा का परिवहन करती हैं। वे संरचनात्मक सहायता भी प्रदान करती हैं।

**मध्यशिरा:** पत्ते से गुजरने वाली केंद्रीय मुख्य शिरा।

**किनारा:** पत्ते का किनारा (चिकना, दांतेदार, पालियों वाला)।

**अग्रभाग:** पत्ते की नोकी।

**आधार:** वह निचला भाग जहां पत्तृण जुड़ता है।

**रंध्र:** गैस विनिमय के लिए नीचे की ओर छोटे छिद्र।

**क्यूटिकल:** सतह पर मोमी सुरक्षात्मक परत।`,
    },
  },
  wateringGuide: {
    en: {
      title: '💧 Watering Guide',
      content: `**How Much:**
• Most plants need 1-1.5 inches of water per week
• Check soil moisture 2 inches deep before watering
• Stick your finger in the soil — if dry, water

**When to Water:**
• Early morning (best) or evening
• Avoid midday (high evaporation)
• Water when top inch of soil is dry

**How to Water:**
• Water deeply and less frequently (encourages deep roots)
• Use drip irrigation or soaker hoses
• Avoid wetting leaves (reduces disease risk)
• Water at the base of plants

**Signs of Overwatering:**
• Yellow leaves, mushy stems, root rot

**Signs of Underwatering:**
• Wilting, dry/crispy leaf edges, drooping`,
    },
    hi: {
      title: '💧 सिंचाई गाइड',
      content: `**कितना पानी दें:**
• अधिकांश पौधों को प्रति सप्ताह 1-1.5 इंच पानी की आवश्यकता होती है
• सिंचाई से पहले 2 इंच गहराई पर मिट्टी की नमी जांचें
• अपनी उंगली मिट्टी में डालें — अगर सूखी है, तो पानी दें

**कब पानी दें:**
• सुबह जल्दी (सबसे अच्छा) या शाम को
• दोपहर में बचें (अधिक वाष्पीकरण)
• जब मिट्टी का ऊपरी इंच सूखा हो तब पानी दें

**कैसे पानी दें:**
• गहराई से और कम बार पानी दें (गहरी जड़ों को प्रोत्साहित करता है)
• ड्रिप सिंचाई या सोकर होज का उपयोग करें
• पत्तों को गीला करने से बचें (रोग का खतरा कम करता है)
• पौधों के आधार पर पानी दें

**अत्यधिक सिंचाई के संकेत:**
• पीले पत्ते, मुलायम तने, जड़ सड़ना

**कम सिंचाई के संकेत:**
• मुरझाना, सूखे/खस्ते पत्तों के किनारे, झुकना`,
    },
  },
  soilHealth: {
    en: {
      title: '🌱 Soil Health',
      content: `**Key Soil Components:**
• Sand — drainage and aeration
• Silt — nutrient retention
• Clay — water and nutrient holding
• Organic matter — food for microbes

**Ideal Soil pH:**
• Most vegetables: 6.0-7.0
• Blueberries: 4.5-5.5
• Asparagus: 6.5-7.5

**Improving Soil:**
• Add compost (2-3 inches annually)
• Use cover crops in off-season
• Minimize tilling (preserves structure)
• Mulch to protect surface

**Signs of Poor Soil:**
• Compaction, poor drainage
• Nutrient deficiencies (yellowing)
• Low earthworm activity
• Crusty surface`,
    },
    hi: {
      title: '🌱 मिट्टी स्वास्थ्य',
      content: `**मिट्टी के मुख्य घटक:**
• रेत — जल निकासी और वायु परिसंचरण
• गाद — पोषक तत्वों को बनाए रखना
• चिकनी मिट्टी — पानी और पोषक तत्व धारण करना
• जैविक पदार्थ — सूक्ष्मजीवों के लिए भोजन

**आदर्श मिट्टी pH:**
• अधिकांश सब्जियां: 6.0-7.0
• ब्लूबेरी: 4.5-5.5
• शतावरी: 6.5-7.5

**मिट्टी में सुधार:**
• खाद डालें (वार्षिक 2-3 इंच)
• ऑफ-सीजन में कवर फसलें उपयोग करें
• जुताई कम करें (संरचना संरक्षित करता है)
• सतह की रक्षा के लिए मल्च

**खराब मिट्टी के संकेत:**
• संघनन, खराब जल निकासी
• पोषक तत्वों की कमी (पीलापन)
• कम केंचुआ गतिविधि
• कठोर सतह`,
    },
  },
  seasonalTips: {
    en: {
      title: '📅 Seasonal Leaf Care',
      content: `**Spring:**
• Inspect for overwintering disease
• Prune dead or damaged branches
• Apply balanced fertilizer
• Start regular monitoring

**Summer:**
• Increase watering frequency
• Watch for heat stress and sunscald
• Mulch to retain moisture
• Scout for pests weekly

**Fall:**
• Collect and destroy fallen leaves
• Reduce watering as growth slows
• Apply late-season fertilizer if needed
• Plan crop rotation for next year

**Winter:**
• Clean and store tools
• Plan next season's garden
• Order disease-resistant seeds
• Prune dormant trees and shrubs`,
    },
    hi: {
      title: '📅 मौसमी पत्ता देखभाल',
      content: `**वसंत:**
• सर्दियों में बचे रोग की जांच करें
• मृत या क्षतिग्रस्त शाखाओं की छंटाई करें
• संतुलित उर्वरक लगाएं
• नियमित निगरानी शुरू करें

**गर्मी:**
• सिंचाई की आवृत्ति बढ़ाएं
• गर्मी तनाव और धूप से जलने के लिए देखें
• नमी बनाए रखने के लिए मल्च
• साप्ताहिक कीटों की जांच करें

**पतझड़:**
• गिरे हुए पत्तों को इकट्ठा करें और नष्ट करें
• विकास धीमा होने पर सिंचाई कम करें
• यदि आवश्यक हो तो मौसम के अंत में उर्वरक लगाएं
• अगले साल के लिए फसल चक्र की योजना बनाएं

**सर्दी:**
• उपकरण साफ करें और संग्रहित करें
• अगले मौसम के बगीचे की योजना बनाएं
• रोग-प्रतिरोधी बीज ऑर्डर करें
• सुस्त पेड़ों और झाड़ियों की छंटाई करें`,
    },
  },
  companionPlanting: {
    en: {
      title: '🌿 Companion Planting',
      content: `**Good Combinations:**
• Tomato + Basil — repels aphids, improves flavor
• Corn + Beans + Squash — "Three Sisters" method
• Carrot + Onion — each repels the other's pests
• Lettuce + Tall plants — provides shade
• Rose + Garlic — deters aphids and beetles

**Bad Combinations:**
• Tomato + Fennel — fennel inhibits tomato growth
• Beans + Onion — onions inhibit bean growth
• Potato + Tomato — both susceptible to same blight
• Walnut + Most plants — juglone toxin

**Benefits:**
• Natural pest control
• Improved pollination
• Better use of space
• Enhanced soil health`,
    },
    hi: {
      title: '🌿 साथी पौधे लगाना',
      content: `**अच्छे संयोजन:**
• टमाटर + तुलसी — एफिड्स को भगाता है, स्वाद बेहतर बनाता है
• मक्का + बीन + कद्दू — "तीन बहनें" विधि
• गाजर + प्याज — प्रत्येक दूसरे के कीटों को भगाता है
• लेट्यूस + ऊंचे पौधे — छाया प्रदान करता है
• गुलाब + लहसुन — एफिड्स और भृंग को भगाता है

**खराब संयोजन:**
• टमाटर + सौंफ — सौंफ टमाटर के विकास को रोकती है
• बीन + प्याज — प्याज बीन के विकास को रोकता है
• आलू + टमाटर — दोनों एक ही अंगमारी के प्रति संवेदनशील
• अखरोट + अधिकांश पौधे — जुग्लोन विषाक्त पदार्थ

**लाभ:**
• प्राकृतिक कीट नियंत्रण
• बेहतर परागण
• स्थान का बेहतर उपयोग
• मिट्टी के स्वास्थ्य में सुधार`,
    },
  },
  organicTips: {
    en: {
      title: '🌱 Organic Gardening Tips',
      content: `**Natural Pest Control:**
• Neem oil spray — repels most insects
• Diatomaceous earth — kills soft-bodied insects
• Companion planting — natural deterrents
• Beneficial insects — ladybugs, lacewings

**Organic Fertilizers:**
• Compost — all-purpose soil amendment
• Fish emulsion — high nitrogen boost
• Bone meal — phosphorus source
• Epsom salt — magnesium supplement

**Disease Prevention:**
• Crop rotation (3-4 year cycles)
• Resistant varieties
• Proper spacing and airflow
• Mulch to prevent soil splash
• Remove infected material promptly

**Soil Building:**
• Cover crops (clover, vetch)
• Composting
• Minimal tillage
• Mulching`,
    },
    hi: {
      title: '🌱 जैविक बागवानी टिप्स',
      content: `**प्राकृतिक कीट नियंत्रण:**
• नीम का तेल स्प्रे — अधिकांश कीटों को भगाता है
• डायटोमेसियस अर्थ — नरम-शरीर वाले कीटों को मारता है
• साथी पौधे लगाना — प्राकृतिक निवारक
• लाभकारी कीट — लेडीबग, लेसविंग्स

**जैविक उर्वरक:**
• खाद — सर्वोपयोगी मिट्टी संशोधन
• मछली का अर्क — उच्च नाइट्रोजन बूस्ट
• हड्डी का चूर्ण — फॉस्फोरस स्रोत
• एप्सम नमक — मैग्नीशियम पूरक

**रोग निवारण:**
• फसल चक्र (3-4 साल के चक्र)
• प्रतिरोधी किस्में
• उचित दूरी और वायु प्रवाह
• मिट्टी की बौछार रोकने के लिए मल्च
• संक्रमित सामग्री को तुरंत हटाएं

**मिट्टी निर्माण:**
• कवर फसलें (क्लोवर, वेच)
• खाद बनाना
• न्यूनतम जुताई
• मल्चिंग`,
    },
  },
  leafColorGuide: {
    en: {
      title: '🎨 Leaf Color Guide',
      content: `**Green:** Healthy, active photosynthesis

**Yellow (Chlorosis):**
• Nitrogen deficiency
• Overwatering
• Root damage
• Iron/manganese deficiency

**Brown (Necrosis):**
• Underwatering / drought
• Salt burn
• Fungal infection
• Wind damage

**Red/Purple:**
• Phosphorus deficiency
• Cold stress
• Anthocyanin buildup

**White/Silver:**
• Powdery mildew
• Pesticide residue
• Spider mite damage

**Pale Green:**
• Light deficiency
• Early nitrogen deficiency
• Virus infection`,
    },
    hi: {
      title: '🎨 पत्ता रंग गाइड',
      content: `**हरा:** स्वस्थ, सक्रिय प्रकाश संश्लेषण

**पीला (क्लोरोसिस):**
• नाइट्रोजन की कमी
• अत्यधिक सिंचाई
• जड़ क्षति
• आयरन/मैंगनीज की कमी

**भूरा (नेक्रोसिस):**
• कम सिंचाई / सूखा
• नमक जलन
• कवक संक्रमण
• हवा क्षति

**लाल/बैंगनी:**
• फॉस्फोरस की कमी
• ठंड का तनाव
• एंथोसायनिन निर्माण

**सफेद/चांदी:**
• चूर्णिल फफूंद
• कीटनाशक अवशेष
• स्पाइडर माइट क्षति

**हल्का हरा:**
• प्रकाश की कमी
• प्रारंभिक नाइट्रोजन की कमी
• वायरल संक्रमण`,
    },
  },
  compostingGuide: {
    en: {
      title: '♻️ Composting Guide',
      content: `**Green Materials (Nitrogen-rich):**
• Fruit and vegetable scraps
• Coffee grounds and tea bags
• Fresh grass clippings
• Eggshells

**Brown Materials (Carbon-rich):**
• Dry leaves and straw
• Cardboard and newspaper
• Wood chips and sawdust
• Dried plant stems

**Ratio:** 3 parts brown to 1 part green

**What NOT to Compost:**
• Meat and dairy products
• Diseased plants
• Pet waste
• Treated wood
• Synthetic materials

**Tips:**
• Turn compost every 1-2 weeks
• Keep moist (like a wrung sponge)
• Cut materials small for faster decomposition
• Compost is ready when dark and crumbly`,
    },
    hi: {
      title: '♻️ खाद बनाने की गाइड',
      content: `**हरी सामग्री (नाइट्रोजन-समृद्ध):**
• फल और सब्जी के टुकड़े
• कॉफी की मैदा और चाय के थैले
• ताजी घास की कतरनें
• अंडे के छिलके

**भूरी सामग्री (कार्बन-समृद्ध):**
• सूखे पत्ते और पुआल
• कार्डबोर्ड और अखबार
• लकड़ी के चिप्स और बर्फ
• सूखे पौधों के तने

**अनुपात:** 3 भाग भूरी, 1 भाग हरी

**क्या न डालें:**
• मांस और डेयरी उत्पाद
• बीमार पौधे
• पालतू जानवरों का अपशिष्ट
• उपचारित लकड़ी
• सिंथेटिक सामग्री

**टिप्स:**
• हर 1-2 सप्ताह में खाद पलटें
• गीला रखें (निचोड़े हुए स्पंज जैसा)
• तेज सड़न के लिए सामग्री छोटी काटें
• खाद तैयार है जब गहरी और भुरभुरी हो`,
    },
  },
  pestIdentification: {
    en: {
      title: '🐛 Common Leaf Pests',
      content: `**Aphids:**
• Tiny green/black insects on new growth
• Cause: curled leaves, sticky honeydew
• Fix: Strong water spray, neem oil, ladybugs

**Spider Mites:**
• Tiny red/yellow dots, fine webbing
• Cause: stippled leaves, drying
• Fix: Increase humidity, neem oil, predatory mites

**Caterpillars:**
• Chew large holes in leaves
• Cause: defoliation
• Fix: Hand-pick, Bt spray, row covers

**Whiteflies:**
• Tiny white flying insects
• Cause: yellowing, stunted growth
• Fix: Yellow sticky traps, neem oil

**Thrips:**
• Tiny slender insects, silver streaks
• Cause: distorted growth, silver patches
• Fix: Blue sticky traps, spinosad spray`,
    },
    hi: {
      title: '🐛 सामान्य पत्ता कीट',
      content: `**एफिड्स:**
• नई वृद्धि पर छोटे हरे/काले कीट
• कारण: मुड़े हुए पत्ते, चिपचिपा शहद
• समाधान: जोर से पानी का स्प्रे, नीम का तेल, लेडीबग

**स्पाइडर माइट्स:**
• छोटे लाल/पीले धब्बे, बारीक जाल
• कारण: धब्बेदार पत्ते, सूखना
• समाधान: आर्द्रता बढ़ाएं, नीम का तेल, शिकारी माइट्स

**कैटरपिलर:**
• पत्तों में बड़े छेद चबाते हैं
• कारण: पत्ता झड़ना
• समाधान: हाथ से उठाएं, Bt स्प्रे, रो कवर

**व्हाइटफ्लाइज:**
• छोटे सफेद उड़ने वाले कीट
• कारण: पीलापन, बौनापन
• समाधान: पीले चिपचिपे जाल, नीम का तेल

**थ्रिप्स:**
• छोटे पतले कीट, चांदी की धारियां
• कारण: विकृत विकास, चांदी के धब्बे
• समाधान: नीले चिपचिपे जाल, स्पिनोसेड स्प्रे`,
    },
  },
  lightRequirements: {
    en: {
      title: '☀️ Light Requirements',
      content: `**Full Sun (6-8+ hours):**
• Tomatoes, peppers, squash
• Roses, lavender
• Most fruit trees
• Herbs: basil, rosemary, thyme

**Partial Shade (3-6 hours):**
• Lettuce, spinach, kale
• Hostas, ferns
• Berries (blueberries, raspberries)
• Herbs: parsley, cilantro

**Full Shade (< 3 hours):**
• Ferns, ivy
• Hostas
• Impatiens, begonias

**Signs of Too Much Light:**
• Scorched/brown leaf edges
• Bleached or faded patches
• Wilting despite moist soil

**Signs of Too Little Light:**
• Leggy, stretched growth
• Pale green or yellow leaves
• Few or no flowers/fruit
• Leaning toward light source`,
    },
    hi: {
      title: '☀️ प्रकाश आवश्यकताएं',
      content: `**पूर्ण धूप (6-8+ घंटे):**
• टमाटर, मिर्च, कद्दू
• गुलाब, लैवेंडर
• अधिकांश फल पेड़
• जड़ी-बूटियां: तुलसी, रोज़मेरी, अजवायन

**आंशिक छाया (3-6 घंटे):**
• लेट्यूस, पालक, केल
• होस्टा, फर्न
• बेरी (ब्लूबेरी, रास्पबेरी)
• जड़ी-बूटियां: पार्सले, धनिया

**पूर्ण छाया (< 3 घंटे):**
• फर्न, आइवी
• होस्टा
• इम्पेशेंस, बेगोनिया

**अधिक प्रकाश के संकेत:**
• जले हुए/भूरे पत्तों के किनारे
• धुंधले या फीके धब्बे
• गीली मिट्टी के बावजूद मुरझाना

**कम प्रकाश के संकेत:**
• लंबा, खिंचा हुआ विकास
• हल्के हरे या पीले पत्ते
• कम या कोई फूल/फल नहीं
• प्रकाश स्रोत की ओर झुकना`,
    },
  },
}

export const DISEASE_DETAILS = {
  healthy: {
    medicines: [],
    medicinesHi: [],
    organicRemedies: [
      'Continue balanced organic fertilization',
      'Maintain composting schedule',
      'Use neem oil spray as preventive measure',
    ],
    organicRemediesHi: [
      'संतुलित जैविक उर्वरक जारी रखें',
      'खाद बनाने का कार्यक्रम बनाए रखें',
      'निवारक उपाय के रूप में नीम का तेल स्प्रे का उपयोग करें',
    ],
    chemicalTreatments: [],
    chemicalTreatmentsHi: [],
    precautions: [
      'Continue regular monitoring for early disease signs',
      'Maintain balanced soil nutrients',
      'Ensure proper drainage around plants',
    ],
    precautionsHi: [
      'रोग के शुरुआती संकेतों के लिए नियमित निगरानी जारी रखें',
      'मिट्टी के पोषक तत्वों को संतुलित रखें',
      'पौधों के चारों ओर उचित जल निकासी सुनिश्चित करें',
    ],
    firstAid: [],
    firstAidHi: [],
    spreadRate: 'N/A',
    spreadRateHi: 'लागू नहीं',
    recoveryTime: 'N/A — maintain good care',
    recoveryTimeHi: 'लागू नहीं — अच्छी देखभाल बनाए रखें',
  },
  'leaf-spot': {
    medicines: [
      'Chlorothalonil (Daconil) — apply at 2-3 ml/L water',
      'Copper hydroxide (Kocide 3000) — 1.5-2 ml/L water',
      'Mancozeb (Dithane M-45) — 2-3 g/L water',
      'Azoxystrobin (Amistar) — 1 ml/L water for systemic control',
    ],
    medicinesHi: [
      'क्लोरोथैलोनिल (डैकोनिल) — 2-3 मिली/लीटर पानी में लगाएं',
      'कॉपर हाइड्रॉक्साइड (कोसाइड 3000) — 1.5-2 मिली/लीटर पानी',
      'मैंकोज़ेब (डिथेन M-45) — 2-3 ग्राम/लीटर पानी',
      'एज़ोक्सीस्ट्रोबिन (अमिस्टार) — 1 मिली/लीटर सिस्टमिक नियंत्रण के लिए',
    ],
    organicRemedies: [
      'Neem oil spray (5ml/L water) — apply every 7 days',
      'Baking soda solution (1 tbsp per gallon water)',
      'Milk spray (40% milk, 60% water) — effective against fungal spots',
      'Garlic extract spray — natural antifungal',
      'Compost tea foliar spray — boosts plant immunity',
    ],
    organicRemediesHi: [
      'नीम का तेल स्प्रे (5मिली/लीटर पानी) — हर 7 दिन में लगाएं',
      'बेकिंग सोडा घोल (1 बड़ा चम्मच प्रति गैलन पानी)',
      'दूध स्प्रे (40% दूध, 60% पानी) — कवक धब्बों के खिलाफ प्रभावी',
      'लहसुन का अर्क स्प्रे — प्राकृतिक कवकनाशी',
      'खाद चाय पत्ती स्प्रे — पौधे की प्रतिरक्षा बढ़ाता है',
    ],
    chemicalTreatments: [
      'Fungicide rotation: Switch between modes of action every 2 weeks',
      'Copper-based bactericide for bacterial leaf spot',
      'Systemic fungicides for severe infections',
      'Apply at first sign — do not wait for spread',
    ],
    chemicalTreatmentsHi: [
      'कवकनाशी रोटेशन: हर 2 सप्ताह में क्रिया मोड बदलें',
      'बैक्टीरियल लीफ स्पॉट के लिए तांबा आधारित बैक्टीरिसाइड',
      'गंभीर संक्रमण के लिए सिस्टमिक कवकनाशी',
      'पहले संकेत पर लगाएं — फैलने की प्रतीक्षा न करें',
    ],
    precautions: [
      'Remove infected leaves immediately — do not compost',
      'Sterilize pruning tools with 70% alcohol between plants',
      'Avoid overhead watering — use drip irrigation',
      'Increase plant spacing to improve airflow',
      'Do not work with wet plants (spreads spores)',
      'Wear gloves when applying chemical treatments',
    ],
    precautionsHi: [
      'संक्रमित पत्तों को तुरंत हटाएं — खाद न बनाएं',
      'पौधों के बीच छंटाई उपकरण को 70% अल्कोहल से कीटाणुरहित करें',
      'ऊपर से सिंचाई से बचें — ड्रिप सिंचाई का उपयोग करें',
      'वायु प्रवाह बढ़ाने के लिए पौधों की दूरी बढ़ाएं',
      'गीले पौधों के साथ काम न करें (बीजाणु फैलते हैं)',
      'रासायनिक उपचार लगाते समय दस्ताने पहनें',
    ],
    firstAid: [
      'If fungicide contacts skin: wash with soap and water for 15 minutes',
      'If in eyes: rinse with clean water for 15 minutes, seek medical help',
      'If ingested: do not induce vomiting, contact poison control',
    ],
    firstAidHi: [
      'अगर कवकनाशी त्वचा पर लगे: 15 मिनट तक साबुन और पानी से धोएं',
      'अगर आंखों में जाए: 15 मिनट तक साफ पानी से धोएं, चिकित्सक से संपर्क करें',
      'अगर निगल लें: उल्टी न कराएं, जहर नियंत्रण केंद्र से संपर्क करें',
    ],
    spreadRate: 'Moderate — spreads via water splash and wind',
    spreadRateHi: 'मध्यम — पानी की बौछार और हवा से फैलता है',
    recoveryTime: '2-4 weeks with treatment',
    recoveryTimeHi: 'उपचार के साथ 2-4 सप्ताह',
  },
  'powdery-mildew': {
    medicines: [
      'Sulfur-based fungicide (Thiovit Jet) — 3-5 g/L water',
      'Myclobutanil (Systhane) — 1 ml/L for systemic control',
      'Penconazole (Topas) — 0.5 ml/L water',
      'Trifloxystrobin (Flint) — 0.3 g/L water',
    ],
    medicinesHi: [
      'सल्फर आधारित कवकनाशी (थायोविट जेट) — 3-5 ग्राम/लीटर पानी',
      'माइक्लोब्यूटानिल (सिस्थेन) — 1 मिली/लीटर सिस्टमिक नियंत्रण के लिए',
      'पेंकोनाज़ोल (टोपाज) — 0.5 मिली/लीटर पानी',
      'ट्राइफ्लॉक्सीस्ट्रोबिन (फ्लिंट) — 0.3 ग्राम/लीटर पानी',
    ],
    organicRemedies: [
      'Milk spray (40% milk + 60% water) — most effective organic remedy',
      'Potassium bicarbonate (1 tbsp per gallon water)',
      'Neem oil (5ml/L) — disrupts fungal cell walls',
      'Horticultural oil spray — suffocates spores',
      'Baking soda + soap solution (1 tsp soda + 1 tsp soap per quart)',
    ],
    organicRemediesHi: [
      'दूध स्प्रे (40% दूध + 60% पानी) — सबसे प्रभावी जैविक उपचार',
      'पोटैशियम बाइकार्बोनेट (1 बड़ा चम्मच प्रति गैलन पानी)',
      'नीम का तेल (5मिली/लीटर) — कवक की कोशिका भित्ति को नष्ट करता है',
      'बागवानी तेल स्प्रे — बीजाणुओं को श्वसन रोकता है',
      'बेकिंग सोडा + साबुन घोल (1 चम्मच सोडा + 1 चम्मच साबुन प्रति क्वार्ट)',
    ],
    chemicalTreatments: [
      'Apply at first white powdery signs — before full spread',
      'Rotate fungicide classes to prevent resistance',
      'Sulfur is preventive, not curative — apply before infection',
      'Systemic fungicides (myclobutanil) for established infections',
    ],
    chemicalTreatmentsHi: [
      'पहले सफेद चूर्णिल संकेतों पर लगाएं — पूर्ण फैलाव से पहले',
      'प्रतिरोध रोकने के लिए कवकनाशी वर्गों को रोटेट करें',
      'सल्फर निवारक है, उपचारात्मक नहीं — संक्रमण से पहले लगाएं',
      'स्थापित संक्रमण के लिए सिस्टमिक कवकनाशी (माइक्लोब्यूटानिल)',
    ],
    precautions: [
      'Do not compost infected material',
      'Increase sunlight exposure — powdery mildew thrives in shade',
      'Prune to open plant canopy for better air circulation',
      'Avoid excessive nitrogen fertilization',
      'Apply sulfur in cool weather (above 32°C causes leaf burn)',
      'Wear mask when applying powdered fungicides',
    ],
    precautionsHi: [
      'संक्रमित सामग्री को खाद न बनाएं',
      'सूर्यप्रकाश बढ़ाएं — चूर्णिल फफूंद छाया में फलती है',
      'बेहतर वायु परिसंचरण के लिए पौधे की छतरी खोलने के लिए छंटाई करें',
      'अत्यधिक नाइट्रोजन उर्वरक से बचें',
      'ठंडे मौसम में सल्फर लगाएं (32°C से ऊपर पत्ते जलते हैं)',
      'पाउडर कवकनाशी लगाते समय मास्क पहनें',
    ],
    firstAid: [
      'Sulfur contact: wash skin with water',
      'Sulfur dust inhalation: move to fresh air, seek medical help if symptoms persist',
      'Neem oil: wash skin if irritation occurs',
    ],
    firstAidHi: [
      'सल्फर संपर्क: पानी से त्वचा धोएं',
      'सल्फर धूल वाष्पशील: ताजी हवा में जाएं, लक्षण बने रहने पर चिकित्सक से संपर्क करें',
      'नीम का तेल: जलन होने पर त्वचा धोएं',
    ],
    spreadRate: 'Fast — airborne spores spread quickly in humid conditions',
    spreadRateHi: 'तेज — आर्द्र परिस्थितियों में हवा द्वारा बीजाणु तेजी से फैलते हैं',
    recoveryTime: '1-3 weeks with treatment',
    recoveryTimeHi: 'उपचार के साथ 1-3 सप्ताह',
  },
  rust: {
    medicines: [
      'Propiconazole (Bumper) — 1 ml/L water, systemic',
      'Triadimefon (Bayleton) — 0.5 g/L water',
      'Tebuconazole (Folicur) — 1 ml/L water',
      'Azoxystrobin + Tebuconazole combo — for severe cases',
    ],
    medicinesHi: [
      'प्रोपिकोनाज़ोल (बंपर) — 1 मिली/लीटर पानी, सिस्टमिक',
      'ट्रायडिमेफोन (बैलेटन) — 0.5 ग्राम/लीटर पानी',
      'टेबुकोनाज़ोल (फोलिक्यूर) — 1 मिली/लीटर पानी',
      'एज़ोक्सीस्ट्रोबिन + टेबुकोनाज़ोल कॉम्बो — गंभीर मामलों के लिए',
    ],
    organicRemedies: [
      'Sulfur dust or wettable sulfur (3g/L) — apply at first pustule',
      'Neem oil spray (5ml/L) — disrupts spore germination',
      'Compost tea — boosts plant immune response',
      'Epsom salt foliar spray (1 tbsp/L) — reduces severity',
      'Remove alternate host plants (barberry bushes for wheat rust)',
    ],
    organicRemediesHi: [
      'सल्फर धूल या वेटेबल सल्फर (3ग्राम/लीटर) — पहले पुस्ट्यूल पर लगाएं',
      'नीम का तेल स्प्रे (5मिली/लीटर) — बीजाणु अंकुरण को रोकता है',
      'खाद चाय — पौधे की प्रतिरक्षा प्रतिक्रिया बढ़ाता है',
      'एप्सम नमक पत्ती स्प्रे (1 बड़ा चम्मच/लीटर) — गंभीरता कम करता है',
      'वैकल्पिक मेजबान पौधे हटाएं (गेहूं रस्ट के लिए बारबेरी झाड़ियां)',
    ],
    chemicalTreatments: [
      'Apply at first orange pustule appearance',
      'Systemic fungicides are most effective for rust',
      'Repeat application every 10-14 days during active infection',
      'Preventive application in high-risk seasons',
    ],
    chemicalTreatmentsHi: [
      'पहले नारंगी पुस्ट्यूल दिखने पर लगाएं',
      'रस्ट के लिए सिस्टमिक कवकनाशी सबसे प्रभावी हैं',
      'सक्रिय संक्रमण के दौरान हर 10-14 दिन में दोबारा लगाएं',
      'उच्च जोखिम वाले मौसम में निवारक अनुप्रयोग',
    ],
    precautions: [
      'Remove and destroy all infected leaves — do not compost rust pustules',
      'Remove alternate host plants within 1km radius',
      'Avoid working in wet fields (spreads rust spores)',
      'Clean shoes and tools after working in infected areas',
      'Monitor weekly during warm, moist weather',
      'Wear protective equipment when applying fungicides',
    ],
    precautionsHi: [
      'सभी संक्रमित पत्तों को हटाएं और नष्ट करें — रस्ट पुस्ट्यूल को खाद न बनाएं',
      '1km त्रिज्या के भीतर वैकल्पिक मेजबान पौधों को हटाएं',
      'गीले खेतों में काम करने से बचें (रस्ट बीजाणु फैलते हैं)',
      'संक्रमित क्षेत्रों में काम करने के बाद जूते और उपकरण साफ करें',
      'गर्म, गीले मौसम में साप्ताहिक निगरानी करें',
      'कवकनाशी लगाते समय सुरक्षा उपकरण पहनें',
    ],
    firstAid: [
      'Fungicide skin contact: wash with soap and water immediately',
      'Fungicide inhalation: move to fresh air, monitor for breathing difficulty',
      'Eye contact: flush with water for 15 minutes, seek medical attention',
    ],
    firstAidHi: [
      'कवकनाशी त्वचा संपर्क: तुरंत साबुन और पानी से धोएं',
      'कवकनाशी वाष्पशील: ताजी हवा में जाएं, सांस लेने में कठिनाई की निगरानी करें',
      'आंखों का संपर्क: 15 मिनट तक पानी से धोएं, चिकित्सा सहायता लें',
    ],
    spreadRate: 'Very fast — can devastate crops within 2 weeks',
    spreadRateHi: 'बहुत तेज — 2 सप्ताह में फसलों को तबाह कर सकता है',
    recoveryTime: '3-4 weeks, but yield loss may be permanent',
    recoveryTimeHi: '3-4 सप्ताह, लेकिन उपज हानि स्थायी हो सकती है',
  },
  blight: {
    medicines: [
      'Mancozeb (Dithane M-45) — 2.5 g/L water',
      'Chlorothalonil (Daconil) — 2 ml/L water',
      'Metalaxyl + Mancozeb (Ridomil Gold) — for Phytophthora blight',
      'Copper oxychloride — 3 g/L for bacterial blight',
    ],
    medicinesHi: [
      'मैंकोज़ेब (डिथेन M-45) — 2.5 ग्राम/लीटर पानी',
      'क्लोरोथैलोनिल (डैकोनिल) — 2 मिली/लीटर पानी',
      'मेटालैक्सिल + मैंकोज़ेब (रिडोमिल गोल्ड) — फाइटोफ्थोरा अंगमारी के लिए',
      'कॉपर ऑक्सीक्लोराइड — 3 ग्राम/लीटर बैक्टीरियल अंगमारी के लिए',
    ],
    organicRemedies: [
      'Bacillus subtilis (Serenade) — biological control agent',
      'Bordeaux mixture (copper sulfate + lime) — traditional remedy',
      'Garlic + chili extract spray — natural antifungal/antibacterial',
      'Compost tea foliar spray — boosts plant immunity',
      'Milk spray (40% milk) — effective against some blight types',
    ],
    organicRemediesHi: [
      'बैसिलस सब्टिलिस (सेरेनेड) — जैविक नियंत्रण एजेंट',
      'बोर्डो मिश्रण (कॉपर सल्फेट + चूना) — पारंपरिक उपचार',
      'लहसुन + मिर्च का अर्क स्प्रे — प्राकृतिक कवकनाशी/जीवाणुनाशी',
      'खाद चाय पत्ती स्प्रे — पौधे की प्रतिरक्षा बढ़ाता है',
      'दूध स्प्रे (40% दूध) — कुछ प्रकार की अंगमारी के खिलाफ प्रभावी',
    ],
    chemicalTreatments: [
      'CRITICAL: Apply immediately at first signs — blight spreads rapidly',
      'Remove ALL infected material before spraying',
      'Copper-based products for bacterial blight',
      'Metalaxyl-based products for Phytophthora blight',
      'Repeat every 5-7 days during wet conditions',
    ],
    chemicalTreatmentsHi: [
      'महत्वपूर्ण: पहले संकेतों पर तुरंत लगाएं — अंगमारी तेजी से फैलती है',
      'स्प्रे करने से पहले सभी संक्रमित सामग्री हटाएं',
      'बैक्टीरियल अंगमारी के लिए तांबा आधारित उत्पाद',
      'फाइटोफ्थोरा अंगमारी के लिए मेटालैक्सिल आधारित उत्पाद',
      'गीली परिस्थितियों में हर 5-7 दिन में दोहराएं',
    ],
    precautions: [
      'EMERGENCY: Remove and burn all infected material immediately',
      'Do NOT work with wet plants — dramatically increases spread',
      'Quarantine affected plants if possible',
      'Sterilize all tools with 10% bleach solution',
      'Improve drainage — waterlogged soil worsens blight',
      'Apply fungicide as preventively in wet seasons',
      'Wear full protective equipment (gloves, mask, goggles)',
      'Wash hands and clothes thoroughly after handling infected plants',
    ],
    precautionsHi: [
      'आपातकाल: सभी संक्रमित सामग्री को तुरंत हटाएं और जलाएं',
      'गीले पौधों के साथ काम न करें — फैलाव को नाटकीय रूप से बढ़ाता है',
      'यदि संभव हो तो प्रभावित पौधों को क्वारंटाइन करें',
      'सभी उपकरणों को 10% ब्लीच घोल से कीटाणुरहित करें',
      'जल निकासी में सुधार करें — पानी से भरी मिट्टी अंगमारी को बिगड़ती है',
      'गीले मौसम में निवारक रूप से कवकनाशी लगाएं',
      'पूर्ण सुरक्षा उपकरण पहनें (दस्ताने, मास्क, गॉगल्स)',
      'संक्रमित पौधों को संभालने के बाद हाथ और कपड़े अच्छी तरह धोएं',
    ],
    firstAid: [
      'Chemical burn from fungicide: flush with water for 20 minutes',
      'Inhalation of copper-based sprays: move to fresh air immediately',
      'Skin irritation: wash with soap, apply antihistamine cream',
      'If symptoms persist: seek medical attention',
    ],
    firstAidHi: [
      'कवकनाशी से रासायनिक जलन: 20 मिनट तक पानी से धोएं',
      'तांबा आधारित स्प्रे का वाष्पशील: तुरंत ताजी हवा में जाएं',
      'त्वचा जलन: साबुन से धोएं, एंटीहिस्टामाइन क्रीम लगाएं',
      'यदि लक्षण बने रहें: चिकित्सा सहायता लें',
    ],
    spreadRate: 'Extremely fast — can kill plants within days',
    spreadRateHi: 'अत्यंत तेज — कुछ दिनों में पौधों को मार सकता है',
    recoveryTime: 'Infected tissue cannot recover — save remaining plant',
    recoveryTimeHi: 'संक्रमित ऊतक ठीक नहीं हो सकता — बाकी पौधे को बचाएं',
  },
}

export default DISEASES
