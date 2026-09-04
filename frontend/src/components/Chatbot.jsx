import { useState, useRef, useEffect, useCallback } from 'react'
import DISEASES, { CHATBOT_RESPONSES, DISEASE_DETAILS } from '../data/diseases'
import { predictLeafAnomaly } from '../services/api'

function matchDisease(text) {
  const lower = text.toLowerCase()
  const map = {
    'healthy': 'healthy',
    'healthy leaf': 'healthy',
    'swasth': 'healthy',
    'leaf spot': 'leaf-spot',
    'leafspot': 'leaf-spot',
    'spot': 'leaf-spot',
    'brown spot': 'leaf-spot',
    'brown spots': 'leaf-spot',
    'patte ka dhabba': 'leaf-spot',
    'patte ke dhabbe': 'leaf-spot',
    'powdery mildew': 'powdery-mildew',
    'powdery': 'powdery-mildew',
    'mildew': 'powdery-mildew',
    'white powder': 'powdery-mildew',
    'white coating': 'powdery-mildew',
    'churnil fungi': 'powdery-mildew',
    'rust': 'rust',
    'rust disease': 'rust',
    'orange pustules': 'rust',
    'rust pustules': 'rust',
    'blight': 'blight',
    'rapid browning': 'blight',
    'wilting': 'blight',
    'tissue death': 'blight',
    'angmari': 'blight',
  }
  for (const [key, id] of Object.entries(map)) {
    if (lower.includes(key)) return DISEASES.find(d => d.id === id)
  }
  return null
}

function getDiseaseNames(lang) {
  return DISEASES.map(d => lang === 'hi' ? `${d.icon} ${d.nameHi}` : `${d.icon} ${d.name}`).join(', ')
}

function getDiseaseSymptomsSummary(lang) {
  return DISEASES.filter(d => d.id !== 'healthy').map(d => {
    if (lang === 'hi') {
      return `${d.icon} **${d.nameHi}**: ${d.symptomsHi.slice(0, 2).join('; ')}`
    }
    return `${d.icon} **${d.name}**: ${d.symptoms.slice(0, 2).join('; ')}`
  }).join('\n')
}

function buildDeepAnalysis(result, lang) {
  const diseaseId = {
    'Healthy': 'healthy',
    'Leaf Spot': 'leaf-spot',
    'Powdery Mildew': 'powdery-mildew',
    'Rust': 'rust',
    'Blight': 'blight',
  }[result.anomaly_type]

  const d = DISEASES.find(dis => dis.id === diseaseId)
  const details = DISEASE_DETAILS[diseaseId]
  if (!d || !details) return null

  const isHealthy = result.anomaly_type === 'Healthy'
  const name = lang === 'hi' ? d.nameHi : d.name
  const icon = d.icon

  const lines = []
  lines.push(`${icon} **${lang === 'hi' ? 'गहन विश्लेषण' : 'DEEP ANALYSIS'}: ${name}**`)
  lines.push('')

  // Confidence
  if (lang === 'hi') {
    lines.push(`📊 **विश्वास स्तर:** ${result.confidence}%`)
  } else {
    lines.push(`📊 **Confidence:** ${result.confidence}%`)
  }
  lines.push('')

  if (isHealthy) {
    if (lang === 'hi') {
      lines.push('✅ आपका पत्ता स्वस्थ दिखता है!')
      lines.push('')
      lines.push('💡 **देखभाल के तरीके:**')
      d.treatmentHi.forEach((t, i) => lines.push(`${i + 1}. ${t}`))
      lines.push('')
      lines.push('🛡️ **रोकथाम:**')
      d.preventionHi.forEach((p, i) => lines.push(`${i + 1}. ${p}`))
      if (details.organicRemediesHi.length > 0) {
        lines.push('')
        lines.push('🌿 **जैविक सुझाव:**')
        details.organicRemediesHi.forEach((r, i) => lines.push(`• ${r}`))
      }
    } else {
      lines.push('✅ Your leaf looks healthy!')
      lines.push('')
      lines.push('💡 **Care Tips:**')
      d.treatment.forEach((t, i) => lines.push(`${i + 1}. ${t}`))
      lines.push('')
      lines.push('🛡️ **Prevention:**')
      d.prevention.forEach((p, i) => lines.push(`${i + 1}. ${p}`))
      if (details.organicRemedies.length > 0) {
        lines.push('')
        lines.push('🌿 **Organic Suggestions:**')
        details.organicRemedies.forEach((r, i) => lines.push(`• ${r}`))
      }
    }
    return lines.join('\n')
  }

  // Disease detected — full deep analysis
  const sev = lang === 'hi' ? d.severityHi : d.severity
  const cat = lang === 'hi' ? d.categoryHi : d.category

  lines.push(`⚠️ **${lang === 'hi' ? 'गंभीरता' : 'Severity'}:** ${sev}`)
  lines.push(`📂 **${lang === 'hi' ? 'श्रेणी' : 'Category'}:** ${cat}`)
  lines.push(`📈 **${lang === 'hi' ? 'फैलने की दर' : 'Spread Rate'}:** ${lang === 'hi' ? details.spreadRateHi : details.spreadRate}`)
  lines.push(`⏱️ **${lang === 'hi' ? 'रिकवरी का समय' : 'Recovery Time'}:** ${lang === 'hi' ? details.recoveryTimeHi : details.recoveryTime}`)
  lines.push('')

  // Symptoms
  const symptoms = lang === 'hi' ? d.symptomsHi : d.symptoms
  lines.push(`🔍 **${lang === 'hi' ? 'लक्षण' : 'Symptoms'}:**`)
  symptoms.forEach((s, i) => lines.push(`${i + 1}. ${s}`))
  lines.push('')

  // Causes
  const causes = lang === 'hi' ? d.causesHi : d.causes
  lines.push(`🦠 **${lang === 'hi' ? 'कारण' : 'Causes'}:**`)
  causes.forEach((c, i) => lines.push(`${i + 1}. ${c}`))
  lines.push('')

  // Medicines
  const meds = lang === 'hi' ? details.medicinesHi : details.medicines
  if (meds.length > 0) {
    lines.push(`💊 **${lang === 'hi' ? 'दवाएं और खुराक' : 'Medicines & Dosage'}:**`)
    meds.forEach((m, i) => lines.push(`${i + 1}. ${m}`))
    lines.push('')
  }

  // Organic Remedies
  const organic = lang === 'hi' ? details.organicRemediesHi : details.organicRemedies
  if (organic.length > 0) {
    lines.push(`🌿 **${lang === 'hi' ? 'जैविक उपचार' : 'Organic Remedies'}:**`)
    organic.forEach((r, i) => lines.push(`${i + 1}. ${r}`))
    lines.push('')
  }

  // Chemical Treatments
  const chem = lang === 'hi' ? details.chemicalTreatmentsHi : details.chemicalTreatments
  if (chem.length > 0) {
    lines.push(`⚗️ **${lang === 'hi' ? 'रासायनिक उपचार' : 'Chemical Treatment'}:**`)
    chem.forEach((c, i) => lines.push(`${i + 1}. ${c}`))
    lines.push('')
  }

  // Precautions
  const prec = lang === 'hi' ? details.precautionsHi : details.precautions
  if (prec.length > 0) {
    lines.push(`🛡️ **${lang === 'hi' ? 'सावधानी और रोकथाम' : 'Precautions'}:**`)
    prec.forEach((p, i) => lines.push(`${i + 1}. ${p}`))
    lines.push('')
  }

  // First Aid
  const aid = lang === 'hi' ? details.firstAidHi : details.firstAid
  if (aid.length > 0) {
    lines.push(`🚑 **${lang === 'hi' ? 'प्राथमिक चिकित्सा' : 'First Aid'}:**`)
    aid.forEach((a, i) => lines.push(`${i + 1}. ${a}`))
    lines.push('')
  }

  // Favorable Conditions
  const fav = lang === 'hi' ? d.favorableConditionsHi : d.favorableConditions
  lines.push(`🌡️ **${lang === 'hi' ? 'अनुकूल परिस्थितियां' : 'Favorable Conditions'}:** ${fav}`)
  lines.push('')

  // Affected Crops
  const crops = lang === 'hi' ? d.affectedCropsHi : d.affectedCrops
  lines.push(`🌾 **${lang === 'hi' ? 'प्रभावित फसलें' : 'Affected Crops'}:** ${crops.join(', ')}`)
  lines.push('')

  // Prevention
  const prev = lang === 'hi' ? d.preventionHi : d.prevention
  lines.push(`🔒 **${lang === 'hi' ? 'भविष्य की रोकथाम' : 'Future Prevention'}:**`)
  prev.forEach((p, i) => lines.push(`${i + 1}. ${p}`))

  return lines.join('\n')
}

function generateResponse(input, lang) {
  const text = input.toLowerCase().trim()

  if (/^(hi|hello|hey|howdy|good morning|good evening|greetings|yo|sup|namaste|namaskar|kaise|kya hal)/i.test(text)) {
    const responses = CHATBOT_RESPONSES.greetings[lang]
    return responses[Math.floor(Math.random() * responses.length)]
  }

  if (/anatomy|structure|parts.*leaf|leaf.*parts|parts of leaf|petiole|blade|lamina|veins|midrib|margin|stomata|cuticle|patte ka bhaag|patte ki sanrachna/i.test(text)) {
    return `${CHATBOT_RESPONSES.leafAnatomy[lang].title}\n\n${CHATBOT_RESPONSES.leafAnatomy[lang].content}`
  }

  if (/water|watering|irrigation|moisture|overwater|underwater|how much water|sichai|pani|sinchayi|sinchne/i.test(text)) {
    return `${CHATBOT_RESPONSES.wateringGuide[lang].title}\n\n${CHATBOT_RESPONSES.wateringGuide[lang].content}`
  }

  if (/soil|compost|ph|nutrients|fertilizer|urea|nitrogen|phosphorus|potassium|mitti|khad|urvarak|npk/i.test(text)) {
    return `${CHATBOT_RESPONSES.soilHealth[lang].title}\n\n${CHATBOT_RESPONSES.soilHealth[lang].content}`
  }

  if (/season|spring|summer|fall|winter|autumn|mausam|ritu|garmi|sardi|barsaat|spring|autumn/i.test(text)) {
    return `${CHATBOT_RESPONSES.seasonalTips[lang].title}\n\n${CHATBOT_RESPONSES.seasonalTips[lang].content}`
  }

  if (/companion|together|pair|intercrop|saathi|sath mein|sath lagana/i.test(text)) {
    return `${CHATBOT_RESPONSES.companionPlanting[lang].title}\n\n${CHATBOT_RESPONSES.companionPlanting[lang].content}`
  }

  if (/organic|natural|chemical free|jaivik|prakritik|kimi free/i.test(text)) {
    return `${CHATBOT_RESPONSES.organicTips[lang].title}\n\n${CHATBOT_RESPONSES.organicTips[lang].content}`
  }

  if (/color|colour|yellow|brown|red|purple|white|silver|pale|rang|peela|bhoora|lal|safed/i.test(text)) {
    if (!matchDisease(text)) {
      return `${CHATBOT_RESPONSES.leafColorGuide[lang].title}\n\n${CHATBOT_RESPONSES.leafColorGuide[lang].content}`
    }
  }

  if (/compost|decompose|rot|khaad banao|composting|decompose/i.test(text)) {
    return `${CHATBOT_RESPONSES.compostingGuide[lang].title}\n\n${CHATBOT_RESPONSES.compostingGuide[lang].content}`
  }

  if (/pest|bug|insect|aphid|caterpillar|mite|whitefly|thrip|keet|kida|makoda|chipkuli/i.test(text)) {
    return `${CHATBOT_RESPONSES.pestIdentification[lang].title}\n\n${CHATBOT_RESPONSES.pestIdentification[lang].content}`
  }

  if (/light|sunlight|shade|sun|direct|indirect|roshni|dhoop|chhanv|prakash/i.test(text)) {
    return `${CHATBOT_RESPONSES.lightRequirements[lang].title}\n\n${CHATBOT_RESPONSES.lightRequirements[lang].content}`
  }

  if (/what diseases|which diseases|disease.*detect|disease.*identify|all diseases|list.*disease|types.*disease/i.test(text)) {
    const names = getDiseaseNames(lang)
    if (lang === 'hi') {
      return `मैं इन पत्ता स्थितियों की पहचान कर सकता हूं और जानकारी दे सकता हूं:\n\n${names}\n\nकिसी विशिष्ट रोग के बारे में विस्तृत जानकारी के लिए पूछें!`
    }
    return `I can detect and provide information on these leaf conditions:\n\n${names}\n\nAsk me about any specific disease for detailed information!`
  }

  if (/symptom|sign|indication|how.*identify|how.*tell|visible|look like|appear|lakshan|dikhte|pata/i.test(text)) {
    const disease = matchDisease(text)
    if (disease) {
      if (lang === 'hi') {
        return `${disease.icon} **${disease.nameHi}** के लक्षण:\n\n${disease.symptomsHi.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nरोकथाम और उपचार के विकल्पों के बारे में और जानें!`
      }
      return `${disease.icon} **${disease.name}** symptoms:\n\n${disease.symptoms.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nLearn more about prevention and treatment options!`
    }
    if (lang === 'hi') {
      return `यहां प्रत्येक रोग के प्रमुख लक्षण हैं:\n\n${getDiseaseSymptomsSummary(lang)}\n\nअधिक जानकारी के लिए किसी विशिष्ट रोग के बारे में पूछें।`
    }
    return `Here are the key symptoms of each disease:\n\n${getDiseaseSymptomsSummary(lang)}\n\nAsk about a specific disease for more details.`
  }

  if (/prevent|avoid|stop|protection|resistant|resistance|precaution|roktham|bachav|suraksha/i.test(text)) {
    const disease = matchDisease(text)
    if (disease) {
      if (lang === 'hi') {
        return `${disease.icon} **${disease.nameHi}** रोकथाम:\n\n${disease.preventionHi.map((p, i) => `${i + 1}. ${p}`).join('\n')}`
      }
      return `${disease.icon} **${disease.name}** prevention:\n\n${disease.prevention.map((p, i) => `${i + 1}. ${p}`).join('\n')}`
    }
    if (lang === 'hi') {
      return `यहां सामान्य रोकथाम युक्तियां हैं:\n\n1. प्रतिरोधी पौधों की किस्में चुनें\n2. वायु परिसंचरण के लिए उचित दूरी बनाए रखें\n3. ऊपर से सिंचाई से बचें\n4. फसल चक्र का अभ्यास करें (3-4 साल)\n5. कटाई के बाद पौधे का मलबा हटाएं\n6. शुरुआती संकेतों के लिए नियमित रूप से पौधों की जांच करें\n7. संतुलित उर्वरक का उपयोग करें\n\nलक्षित रोकथाम के लिए किसी विशिष्ट रोग के बारे में पूछें।`
    }
    return `Here are general prevention tips:\n\n1. Choose resistant plant varieties\n2. Maintain proper spacing for air circulation\n3. Avoid overhead watering\n4. Practice crop rotation (3-4 years)\n5. Remove plant debris after harvest\n6. Monitor plants regularly for early signs\n7. Use balanced fertilization\n\nAsk about a specific disease for targeted prevention.`
  }

  if (/treat|cure|remedy|fix|control|manage|fungicide|spray|medicine|chemical|organic|ilaj|upchar|dawa/i.test(text)) {
    const disease = matchDisease(text)
    if (disease) {
      if (lang === 'hi') {
        return `${disease.icon} **${disease.nameHi}** उपचार:\n\n${disease.treatmentHi.map((t, i) => `${i + 1}. ${t}`).join('\n')}`
      }
      return `${disease.icon} **${disease.name}** treatment:\n\n${disease.treatment.map((t, i) => `${i + 1}. ${t}`).join('\n')}`
    }
    if (lang === 'hi') {
      return `सामान्य उपचार दृष्टिकोण:\n\n1. संक्रमित पौधों के हिस्सों को तुरंत हटाएं\n2. उपयुक्त कवकनाशी या जीवाणुनाशक लगाएं\n3. वायु परिसंचरण में सुधार करें और आर्द्रता कम करें\n4. ऊपर से सिंचाई के बजाय ड्रिप सिंचाई का उपयोग करें\n5. जैविक विकल्पों जैसे नीम के तेल का उपयोग करें\n\nविशिष्ट उपचार सलाह के लिए बताएं कि आप किस रोग से निपट रहे हैं।`
    }
    return `General treatment approaches:\n\n1. Remove infected plant parts promptly\n2. Apply appropriate fungicide or bactericide\n3. Improve air circulation and reduce humidity\n4. Switch from overhead to drip irrigation\n5. Use organic options like neem oil\n\nTell me which disease you're dealing with for specific treatment advice.`
  }

  if (/cause|cause of|pathogen|fungal|bacterial|virus|why.*happen|what.*causes|karan|kyun|kaaran/i.test(text)) {
    const disease = matchDisease(text)
    if (disease) {
      if (lang === 'hi') {
        return `${disease.icon} **${disease.nameHi}** के कारण:\n\n${disease.causesHi.map((c, i) => `${i + 1}. ${c}`).join('\n')}`
      }
      return `${disease.icon} **${disease.name}** causes:\n\n${disease.causes.map((c, i) => `${i + 1}. ${c}`).join('\n')}`
    }
    if (lang === 'hi') {
      return `पत्ता रोगों के सामान्य कारण:\n\n• कवक रोगजनक (सबसे आम)\n• बैक्टीरियल संक्रमण\n• पर्यावरणीय तनाव (अत्यधिक सिंचाई, खराब जल निकासी)\n• खराब वायु परिसंचरण\n• दूषित उपकरण या मिट्टी\n\nइसके सटीक कारणों के लिए किसी विशिष्ट रोग के बारे में पूछें।`
    }
    return `Common causes of leaf diseases:\n\n• Fungal pathogens (most common)\n• Bacterial infections\n• Environmental stress (overwatering, poor drainage)\n• Poor air circulation\n• Contaminated tools or soil\n\nAsk about a specific disease for its exact causes.`
  }

  if (/crop|plant|host|affect.*which|which.*crop|which.*plant|grow|fasal|ugana|kheti/i.test(text)) {
    const disease = matchDisease(text)
    if (disease) {
      if (lang === 'hi') {
        return `${disease.icon} **${disease.nameHi}** आम तौर पर प्रभावित करता है:\n\n${disease.affectedCropsHi.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\nनोट: अनुकूल परिस्थितियों में यह रोग संभावित रूप से अन्य प्रजातियों को भी प्रभावित कर सकता है।`
      }
      return `${disease.icon} **${disease.name}** commonly affects:\n\n${disease.affectedCrops.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\nNote: This disease can potentially affect other species under favorable conditions.`
    }
    if (lang === 'hi') {
      return `प्रत्येक रोग की विशिष्ट मेजबान पौधे होते हैं। किसी विशिष्ट रोग (पत्ता धब्बा, चूर्णिल फफूंद, रस्ट, या अंगमारी) के बारे में पूछें कि यह किन फसलों को आम तौर पर प्रभावित करता है।`
    }
    return `Each disease has specific host plants. Ask me about a specific disease (Leaf Spot, Powdery Mildew, Rust, or Blight) to learn which crops it commonly affects.`
  }

  if (/condition|weather|temperature|humidity|climate|environment|when|where|season|mausam|tapman|nami|vatavaran/i.test(text)) {
    const disease = matchDisease(text)
    if (disease) {
      if (lang === 'hi') {
        return `${disease.icon} **${disease.nameHi}** अनुकूल परिस्थितियां:\n\n${disease.favorableConditionsHi}\n\nश्रेणी: ${disease.categoryHi}`
      }
      return `${disease.icon} **${disease.name}** favorable conditions:\n\n${disease.favorableConditions}\n\nCategory: ${disease.category}`
    }
    if (lang === 'hi') {
      return `पत्ता रोग आमतौर पर गर्म, आर्द्र परिस्थितियों में फलते-फूलते हैं जहां वायु परिसंचरण खराब होता है। प्रत्येक रोग की विशिष्ट आवश्यकताएं होती हैं - विवरण के लिए किसी विशिष्ट रोग के बारे में पूछें।`
    }
    return `Leaf diseases generally thrive in warm, humid conditions with poor air circulation. Each disease has specific requirements - ask about a particular disease for details.`
  }

  if (/severity|serious|dangerous|harmful|bad|kill|deadly|mild|moderate|severe|gambhir|khatarnak|halke|teevra/i.test(text)) {
    const disease = matchDisease(text)
    if (disease) {
      if (lang === 'hi') {
        return `${disease.icon} **${disease.nameHi}** गंभीरता: **${disease.severityHi}**\n\n${disease.descriptionHi}`
      }
      return `${disease.icon} **${disease.name}** severity: **${disease.severity}**\n\n${disease.description}`
    }
    if (lang === 'hi') {
      return `गंभीरता स्तर:\n\n🟢 स्वस्थ — कोई चिंता नहीं\n🟤 पत्ता धब्बा — मध्यम से गंभीर\n⬜ चूर्णिल फफूंद — मध्यम\n🟠 रस्ट — मध्यम से गंभीर\n⬛ अंगमारी — गंभीर\n\nशीघ्र पहचान गंभीर क्षति को रोकने की कुंजी है।`
    }
    return `Severity levels:\n\n🟢 Healthy — No concern\n🟤 Leaf Spot — Moderate to Severe\n⬜ Powdery Mildew — Moderate\n🟠 Rust — Moderate to Severe\n⬛ Blight — Severe\n\nEarly detection is key to preventing severe damage.`
  }

  if (/what is|describe|explain|tell me about|info|information|about.*disease|definition|kya hai|samjhao|batao/i.test(text)) {
    const disease = matchDisease(text)
    if (disease) {
      if (lang === 'hi') {
        return `${disease.icon} **${disease.nameHi}**\n\n${disease.descriptionHi}\n\nश्रेणी: ${disease.categoryHi}\nगंभीरता: ${disease.severityHi}\n\nलक्षणों, उपचार या रोकथाम के बारे में और जानकारी के लिए पूछें!`
      }
      return `${disease.icon} **${disease.name}**\n\n${disease.description}\n\nCategory: ${disease.category}\nSeverity: ${disease.severity}\n\nAsk about symptoms, treatment, or prevention for more details!`
    }
    if (lang === 'hi') {
      return `मैं इनके बारे में विस्तृत जानकारी दे सकता हूं:\n\n• स्वस्थ पत्ता\n• पत्ता धब्बा\n• चूर्णिल फफूंद\n• रस्ट रोग\n• अंगमारी\n\nआप किस रोग के बारे में जानना चाहेंगे?`
    }
    return `I can provide detailed information about:\n\n• Healthy Leaf\n• Leaf Spot\n• Powdery Mildew\n• Rust Disease\n• Blight\n\nWhich disease would you like to learn about?`
  }

  const disease = matchDisease(text)
  if (disease) {
    const faqs = lang === 'hi' ? disease.faqHi : disease.faq
    for (const faq of faqs) {
      if (text.includes(faq.q.slice(0, 10).toLowerCase()) || text.includes(faq.a.slice(0, 10).toLowerCase())) {
        if (lang === 'hi') {
          return `${disease.icon} **${disease.nameHi}**\n\n**प्र:** ${faq.q}\n**उ:** ${faq.a}`
        }
        return `${disease.icon} **${disease.name}**\n\n**Q:** ${faq.q}\n**A:** ${faq.a}`
      }
    }
    if (lang === 'hi') {
      return `${disease.icon} **${disease.nameHi}**\n\n${disease.descriptionHi}\n\nमैं इसके लक्षणों, कारणों, उपचारों, रोकथाम, प्रभावित फसलों और गंभीरता के बारे में बता सकता हूं। आप क्या जानना चाहेंगे?`
    }
    return `${disease.icon} **${disease.name}**\n\n${disease.description}\n\nI can tell you about its symptoms, causes, treatments, prevention, affected crops, and severity. What would you like to know?`
  }

  const fallbacks = CHATBOT_RESPONSES.fallback[lang]
  return fallbacks[Math.floor(Math.random() * fallbacks.length)]
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      <div className="w-2 h-2 bg-leaf-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-leaf-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-leaf-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  )
}

function parseMessage(text) {
  return text.split('\n').map((line, j) => {
    if (line.startsWith('• ')) {
      return <p key={j} className="ml-1">• {line.slice(2)}</p>
    }
    if (line.startsWith('**') && line.endsWith('**')) {
      return <p key={j} className="font-semibold text-white mt-2">{line.replace(/\*\*/g, '')}</p>
    }
    if (line.match(/^\d+\.\s/)) {
      return <p key={j} className="ml-1">{line}</p>
    }
    return <p key={j} className={line.startsWith('**') ? 'font-semibold text-white' : ''}>{line.replace(/\*\*/g, '')}</p>
  })
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [lang, setLang] = useState('en')
  const [isDragging, setIsDragging] = useState(false)
  const [analyzingImage, setAnalyzingImage] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const responses = CHATBOT_RESPONSES.greetings[lang]
      const greeting = responses[Math.floor(Math.random() * responses.length)]
      setMessages([{ role: 'bot', text: greeting, time: new Date() }])
    }
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const toggleLang = () => {
    setLang(prev => prev === 'en' ? 'hi' : 'en')
    setMessages([])
  }

  const analyzeImage = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return

    const previewUrl = URL.createObjectURL(file)
    const userMsg = {
      role: 'user',
      text: lang === 'hi' ? '📷 पत्ते की छवि अपलोड की' : '📷 Uploaded leaf image',
      time: new Date(),
      imagePreview: previewUrl,
    }
    setMessages(prev => [...prev, userMsg])
    setIsTyping(true)
    setAnalyzingImage(true)

    try {
      const result = await predictLeafAnomaly(file)
      const deepAnalysis = buildDeepAnalysis(result, lang)

      const botMsg = {
        role: 'bot',
        text: deepAnalysis,
        time: new Date(),
        isDeepAnalysis: true,
        prediction: result,
      }
      setMessages(prev => [...prev, botMsg])
    } catch (err) {
      const errorMsg = lang === 'hi'
        ? `⚠️ विश्लेषण विफल: ${err.message}\n\nकृपया सुनिश्चित करें कि बैकेंड सर्वर पोर्ट 8000 पर चल रहा है।`
        : `⚠️ Analysis failed: ${err.message}\n\nMake sure the backend server is running on port 8000.`
      setMessages(prev => [...prev, { role: 'bot', text: errorMsg, time: new Date() }])
    } finally {
      setIsTyping(false)
      setAnalyzingImage(false)
    }
  }, [lang])

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    analyzeImage(file)
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) analyzeImage(file)
    e.target.value = ''
  }

  const sendMessage = (text) => {
    if (!text.trim()) return
    const userMsg = { role: 'user', text: text.trim(), time: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    setTimeout(() => {
      const response = generateResponse(text, lang)
      setMessages(prev => [...prev, { role: 'bot', text: response, time: new Date() }])
      setIsTyping(false)
    }, 600 + Math.random() * 800)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleQuickAction = (query) => sendMessage(query)

  const quickActions = CHATBOT_RESPONSES.quickActions[lang]
  const placeholders = {
    en: 'Ask about a disease...',
    hi: 'किसी रोग के बारे में पूछें...',
  }
  const headerSubtitle = {
    en: 'Disease Reference',
    hi: 'रोग संदर्भ',
  }
  const closeLabel = {
    en: 'Close chat',
    hi: 'चैट बंद करें',
  }
  const openLabel = {
    en: 'Ask about plant diseases',
    hi: 'पौधों के रोगों के बारे में पूछें',
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 ${
          isOpen
            ? 'bg-forest-mid border border-red-600/50 shadow-red-900/30 rotate-0'
            : 'bg-leaf-600 hover:bg-leaf-500 shadow-leaf-900/50 animate-pulse-glow'
        }`}
        title={isOpen ? closeLabel[lang] : openLabel[lang]}
      >
        {isOpen ? (
          <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] animate-slideUp"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className={`bg-forest-dark border rounded-2xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col transition-colors duration-200 ${
            isDragging ? 'border-leaf-400 shadow-leaf-500/30' : 'border-leaf-800/40'
          }`} style={{ height: '520px' }}>
            {/* Header */}
            <div className="bg-gradient-to-r from-leaf-900/80 to-forest-mid border-b border-leaf-800/40 px-5 py-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-leaf-600/20 rounded-xl flex items-center justify-center border border-leaf-600/30">
                  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                    <path d="M17 8C8 10 5.9 16.17 3.82 19.82C4.5 18.5 6 16 8 14c-1 2-1.5 4-1.5 6 0 0 3-3 6-6-1 2-1.5 4-1.5 6 0 0 4-4 6.5-9.5.8-1.8 1-3.5 1-4.5 0 0-1 1-2.5 1.5C17 7 17 8 17 8z" fill="#4ade80"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-sm">LeafScan AI</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-leaf-400 rounded-full animate-pulse" />
                    <span className="text-leaf-400 text-xs font-mono">{headerSubtitle[lang]}</span>
                  </div>
                </div>
                <button
                  onClick={toggleLang}
                  className="flex items-center gap-1 bg-leaf-800/40 hover:bg-leaf-700/50 border border-leaf-600/30 rounded-lg px-2.5 py-1.5 transition-all"
                  title={lang === 'en' ? 'हिंदी में बदलें' : 'Switch to English'}
                >
                  <span className="text-xs font-mono text-leaf-300">{lang === 'en' ? 'EN' : 'HI'}</span>
                  <svg className="w-3.5 h-3.5 text-leaf-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Drag Overlay */}
            {isDragging && (
              <div className="absolute inset-0 z-40 bg-leaf-900/80 backdrop-blur-sm flex flex-col items-center justify-center border-2 border-dashed border-leaf-400 rounded-2xl m-2 pointer-events-none">
                <svg className="w-12 h-12 text-leaf-400 mb-3 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-leaf-300 font-semibold text-sm">
                  {lang === 'hi' ? 'पत्ते की छवि छोड़ें' : 'Drop leaf image here'}
                </p>
                <p className="text-leaf-400/70 text-xs mt-1">
                  {lang === 'hi' ? 'गहन विश्लेषण के लिए' : 'For deep analysis'}
                </p>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-leaf-600 text-white rounded-br-md'
                      : msg.isDeepAnalysis
                        ? 'bg-gradient-to-br from-forest-mid to-forest-dark border border-leaf-700/40 text-gray-300 rounded-bl-md'
                        : 'bg-forest-mid border border-leaf-900/40 text-gray-300 rounded-bl-md'
                  }`}>
                    {msg.imagePreview && (
                      <div className="mb-2 rounded-lg overflow-hidden border border-leaf-700/30">
                        <img src={msg.imagePreview} alt="Uploaded leaf" className="w-full max-h-32 object-contain" />
                      </div>
                    )}
                    {msg.role === 'bot' ? (
                      <div className="whitespace-pre-line">
                        {parseMessage(msg.text)}
                      </div>
                    ) : (
                      <p>{msg.text}</p>
                    )}
                  </div>
                </div>
              ))}
              {(isTyping || analyzingImage) && (
                <div className="flex justify-start">
                  <div className="bg-forest-mid border border-leaf-900/40 rounded-2xl rounded-bl-md">
                    {analyzingImage ? (
                      <div className="flex items-center gap-2 px-4 py-3">
                        <div className="w-4 h-4 border-2 border-leaf-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-leaf-400 text-xs font-mono">
                          {lang === 'hi' ? 'विश्लेषण हो रहा है...' : 'Analyzing...'}
                        </span>
                      </div>
                    ) : (
                      <TypingIndicator />
                    )}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length <= 1 && (
              <div className="px-5 pb-3 flex flex-wrap gap-2 shrink-0">
                {quickActions.map(({ label, query }) => (
                  <button
                    key={label}
                    onClick={() => handleQuickAction(query)}
                    className="bg-forest-mid border border-leaf-900/40 text-leaf-400 hover:bg-leaf-900/30 hover:border-leaf-700/40 text-xs font-mono px-3 py-1.5 rounded-lg transition-all"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="border-t border-leaf-800/40 px-4 py-3 shrink-0">
              <div className="flex items-center gap-2 bg-forest-mid/60 border border-leaf-900/40 rounded-xl px-4 py-2">
                {/* Image Upload Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-leaf-400 hover:text-leaf-300 transition-colors shrink-0"
                  title={lang === 'hi' ? 'पत्ते की छवि अपलोड करें' : 'Upload leaf image'}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={placeholders[lang]}
                    className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-600 font-body"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="text-leaf-400 hover:text-leaf-300 disabled:text-gray-700 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </form>
              </div>
              <p className="text-[10px] text-gray-600 text-center mt-1.5 font-mono">
                {lang === 'hi'
                  ? '💡 पत्ते की छवि खींचें या अपलोड करें — AI गहन विश्लेषण देगा'
                  : '💡 Drag & drop or upload a leaf image for AI deep analysis'}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
