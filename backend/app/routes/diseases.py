"""
Disease Information Routes
==========================
GET /diseases       — List all diseases with details
GET /diseases/{name} — Get info for a specific disease
"""

import logging

from fastapi import APIRouter, HTTPException

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/diseases", tags=["Disease Info"])

# Disease database
DISEASES_DB = {
    "Healthy": {
        "name": "Healthy",
        "description": "The leaf shows no signs of disease or abnormality. It appears vibrant, green, and structurally sound.",
        "symptoms": [
            "Uniform green coloration",
            "No spots, lesions, or discoloration",
            "Normal leaf shape and size",
            "Intact leaf margins",
        ],
        "causes": "N/A — healthy plant tissue",
        "treatment": "No treatment needed. Maintain proper watering, sunlight, and nutrition.",
        "prevention": [
            "Regular watering schedule",
            "Adequate sunlight exposure",
            "Balanced fertilization",
            "Proper spacing between plants",
        ],
        "severity": "none",
        "affected_area": "None",
        "image_url": "/images/diseases/healthy.jpg",
    },
    "Leaf Spot": {
        "name": "Leaf Spot",
        "description": "A fungal or bacterial disease causing circular or irregular dark spots on leaves. Can lead to leaf drop and reduced photosynthesis.",
        "symptoms": [
            "Dark brown or black spots on leaves",
            "Spots may have yellow halos",
            "Spots can merge forming larger necrotic areas",
            "Premature leaf drop in severe cases",
        ],
        "causes": [
            "Fungal pathogens (Cercospora, Septoria, Alternaria)",
            "Bacterial infections (Xanthomonas, Pseudomonas)",
            "High humidity and wet conditions",
            "Poor air circulation",
        ],
        "treatment": [
            "Remove and destroy affected leaves",
            "Apply fungicide (chlorothalonil or mancozeb)",
            "Copper-based sprays for bacterial spots",
            "Improve air circulation around plants",
        ],
        "prevention": [
            "Avoid overhead watering",
            "Water at the base of plants",
            "Ensure proper spacing for air flow",
            "Remove plant debris in fall",
            "Rotate crops annually",
        ],
        "severity": "moderate",
        "affected_area": "Leaves, stems",
        "image_url": "/images/diseases/leaf_spot.jpg",
    },
    "Powdery Mildew": {
        "name": "Powdery Mildew",
        "description": "A fungal disease appearing as white powdery spots on leaves and stems. Reduces plant vigor and can stunt growth.",
        "symptoms": [
            "White powdery coating on leaf surfaces",
            "Yellowing of affected areas",
            "Leaf curling and distortion",
            "Stunted new growth",
            "Premature leaf drop",
        ],
        "causes": [
            "Fungal pathogen (Erysiphe, Podosphaera, Sphaerotheca)",
            "High humidity with dry leaf surfaces",
            "Poor air circulation",
            "Shaded growing conditions",
        ],
        "treatment": [
            "Apply fungicide (sulfur-based or potassium bicarbonate)",
            "Neem oil spray as organic alternative",
            "Remove severely affected leaves",
            "Improve sunlight exposure",
        ],
        "prevention": [
            "Choose resistant varieties",
            "Ensure adequate spacing",
            "Prune to improve air circulation",
            "Avoid excessive nitrogen fertilization",
            "Water in the morning so leaves dry quickly",
        ],
        "severity": "moderate",
        "affected_area": "Leaves, stems, flowers",
        "image_url": "/images/diseases/powdery_mildew.jpg",
    },
    "Rust": {
        "name": "Rust",
        "description": "A fungal disease characterized by orange-brown pustules on leaf undersides. Can significantly reduce crop yield.",
        "symptoms": [
            "Orange, yellow, or brown pustules on leaf undersides",
            "Yellowing of upper leaf surfaces",
            "Premature leaf drop",
            "Reduced plant vigor",
            "Distorted leaf growth in severe cases",
        ],
        "causes": [
            "Fungal pathogen (Puccinia, Uromyces)",
            "Warm, humid conditions",
            "Extended leaf wetness",
            "Wind-dispersed spores",
        ],
        "treatment": [
            "Apply fungicide (myclobutanil or propiconazole)",
            "Remove and destroy infected plant material",
            "Improve air circulation",
            "Avoid wetting leaves during irrigation",
        ],
        "prevention": [
            "Plant rust-resistant varieties",
            "Ensure proper plant spacing",
            "Avoid overhead irrigation",
            "Remove volunteer plants and alternate hosts",
            "Monitor regularly for early signs",
        ],
        "severity": "high",
        "affected_area": "Leaves, stems",
        "image_url": "/images/diseases/rust.jpg",
    },
    "Blight": {
        "name": "Blight",
        "description": "A rapid and complete browning and death of plant tissues. Can affect leaves, stems, and flowers, leading to significant crop loss.",
        "symptoms": [
            "Sudden browning or blackening of plant tissues",
            "Water-soaked lesions that expand rapidly",
            "Wilting despite adequate soil moisture",
            "Stem cankers and collapse",
            "Foul smell in bacterial blight",
        ],
        "causes": [
            "Fungal pathogens (Phytophthora, Alternaria, Fusarium)",
            "Bacterial pathogens (Erwinia, Pseudomonas)",
            "Prolonged wet conditions",
            "Poor drainage and waterlogged soil",
            "Warm temperatures with high humidity",
        ],
        "treatment": [
            "Remove and destroy all affected plant parts immediately",
            "Apply copper-based bactericide for bacterial blight",
            "Fungicide application for fungal blight",
            "Improve drainage around affected plants",
        ],
        "prevention": [
            "Ensure well-draining soil",
            "Avoid overwatering",
            "Use disease-free seeds and transplants",
            "Practice crop rotation (3+ years)",
            "Sanitize tools between plants",
            "Remove crop debris after harvest",
        ],
        "severity": "high",
        "affected_area": "Leaves, stems, roots, flowers",
        "image_url": "/images/diseases/blight.jpg",
    },
}


@router.get("")
async def list_diseases():
    """List all diseases with their information."""
    return {
        "total": len(DISEASES_DB),
        "diseases": list(DISEASES_DB.values()),
    }


@router.get("/{disease_name}")
async def get_disease_info(disease_name: str):
    """Get detailed information for a specific disease."""
    # Case-insensitive lookup
    for key in DISEASES_DB:
        if key.lower() == disease_name.lower():
            return DISEASES_DB[key]

    raise HTTPException(
        status_code=404,
        detail=f"Disease '{disease_name}' not found. Available: {', '.join(DISEASES_DB.keys())}"
    )


@router.get("/{disease_name}/treatment")
async def get_disease_treatment(disease_name: str):
    """Get treatment recommendations for a specific disease."""
    for key in DISEASES_DB:
        if key.lower() == disease_name.lower():
            disease = DISEASES_DB[key]
            return {
                "name": disease["name"],
                "severity": disease["severity"],
                "treatment": disease["treatment"],
                "prevention": disease["prevention"],
            }

    raise HTTPException(status_code=404, detail=f"Disease '{disease_name}' not found")


@router.get("/{disease_name}/prevention")
async def get_disease_prevention(disease_name: str):
    """Get prevention tips for a specific disease."""
    for key in DISEASES_DB:
        if key.lower() == disease_name.lower():
            disease = DISEASES_DB[key]
            return {
                "name": disease["name"],
                "prevention": disease["prevention"],
                "causes": disease["causes"],
            }

    raise HTTPException(status_code=404, detail=f"Disease '{disease_name}' not found")
