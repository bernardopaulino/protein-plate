// Gerado por scripts/content-build.ts a partir de content/foods. Não editar.
import type { Food } from "@/domain/food";

export const FOOD_DATA_VERSION = 3;

export const FOOD_SOURCE = "TCA, INSA (Tabela da Composição de Alimentos)";

export const FOODS: readonly Food[] = [
  {
    "id": "bife-vaca",
    "name": {
      "pt": "Bife de vaca (alcatra ou pojadouro)",
      "en": "Beef steak (rump)"
    },
    "category": "carne",
    "role": "protein",
    "proteinPer100g": 21.5,
    "kcalPer100g": 125,
    "carbsPer100g": 0,
    "fatPer100g": 4.5,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "bife-vaca:bife",
        "label": {
          "pt": "1 bife",
          "en": "1 steak"
        },
        "grams": 150,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 2,
    "exampleRank": 68,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Na frigideira com alho"
      ],
      "en": [
        "Pan-fried with garlic"
      ]
    }
  },
  {
    "id": "bife-vitela",
    "name": {
      "pt": "Bife de vitela",
      "en": "Veal steak"
    },
    "category": "carne",
    "role": "protein",
    "proteinPer100g": 21,
    "kcalPer100g": 110,
    "carbsPer100g": 0,
    "fatPer100g": 3,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "bife-vitela:bife",
        "label": {
          "pt": "1 bife",
          "en": "1 steak"
        },
        "grams": 130,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 2,
    "exampleRank": 60,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Grelhado com salada"
      ],
      "en": [
        "Grilled with salad"
      ]
    }
  },
  {
    "id": "carne-picada-peru",
    "name": {
      "pt": "Carne picada de peru",
      "en": "Minced turkey"
    },
    "category": "carne",
    "role": "protein",
    "proteinPer100g": 19.5,
    "kcalPer100g": 150,
    "carbsPer100g": 0,
    "fatPer100g": 8,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "carne-picada-peru:dose",
        "label": {
          "pt": "1 dose",
          "en": "1 serving"
        },
        "grams": 125,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 3,
    "exampleRank": 62,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Almôndegas com tomate"
      ],
      "en": [
        "Meatballs in tomato sauce"
      ]
    }
  },
  {
    "id": "carne-picada-vaca",
    "name": {
      "pt": "Carne picada de vaca magra",
      "en": "Lean minced beef"
    },
    "category": "carne",
    "role": "protein",
    "proteinPer100g": 20.5,
    "kcalPer100g": 137,
    "carbsPer100g": 0,
    "fatPer100g": 7,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "carne-picada-vaca:dose",
        "label": {
          "pt": "1 dose",
          "en": "1 serving"
        },
        "grams": 125,
        "default": true
      },
      {
        "id": "carne-picada-vaca:100g",
        "label": {
          "pt": "100 g",
          "en": "100 g"
        },
        "grams": 100
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 3,
    "exampleRank": 70,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Bolonhesa com massa",
        "Hambúrguer caseiro no forno"
      ],
      "en": [
        "Bolognese with pasta",
        "Homemade oven burger"
      ]
    }
  },
  {
    "id": "coelho",
    "name": {
      "pt": "Coelho",
      "en": "Rabbit"
    },
    "category": "carne",
    "role": "protein",
    "proteinPer100g": 21,
    "kcalPer100g": 135,
    "carbsPer100g": 0,
    "fatPer100g": 5.5,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "coelho:dose",
        "label": {
          "pt": "1 dose",
          "en": "1 serving"
        },
        "grams": 180,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 3,
    "exampleRank": 40,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Estufado com vinho branco"
      ],
      "en": [
        "Stewed with white wine"
      ]
    }
  },
  {
    "id": "coxa-frango",
    "name": {
      "pt": "Coxa de frango sem pele",
      "en": "Skinless chicken thigh"
    },
    "category": "carne",
    "role": "protein",
    "proteinPer100g": 19.5,
    "kcalPer100g": 120,
    "carbsPer100g": 0,
    "fatPer100g": 4.5,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "coxa-frango:2-coxas",
        "label": {
          "pt": "2 coxas",
          "en": "2 thighs"
        },
        "grams": 200,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 3,
    "exampleRank": 72,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "No forno com batata e limão"
      ],
      "en": [
        "Roasted with potato and lemon"
      ]
    }
  },
  {
    "id": "febras-porco",
    "name": {
      "pt": "Febras de porco",
      "en": "Pork cutlets"
    },
    "category": "carne",
    "role": "protein",
    "proteinPer100g": 20,
    "kcalPer100g": 150,
    "carbsPer100g": 0,
    "fatPer100g": 7.5,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "febras-porco:2-febras",
        "label": {
          "pt": "2 febras",
          "en": "2 cutlets"
        },
        "grams": 160,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 2,
    "exampleRank": 56,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Grelhadas com alho e colorau"
      ],
      "en": [
        "Grilled with garlic and paprika"
      ]
    }
  },
  {
    "id": "figado-vaca",
    "name": {
      "pt": "Fígado de vaca",
      "en": "Beef liver"
    },
    "category": "carne",
    "role": "protein",
    "proteinPer100g": 20,
    "kcalPer100g": 135,
    "carbsPer100g": 3.9,
    "fatPer100g": 3.6,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "figado-vaca:bife",
        "label": {
          "pt": "1 bife",
          "en": "1 steak"
        },
        "grams": 120,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 2,
    "exampleRank": 20,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Iscas com cebola"
      ],
      "en": [
        "With onions"
      ]
    }
  },
  {
    "id": "lombo-porco",
    "name": {
      "pt": "Lombo de porco",
      "en": "Pork loin"
    },
    "category": "carne",
    "role": "protein",
    "proteinPer100g": 21,
    "kcalPer100g": 140,
    "carbsPer100g": 0,
    "fatPer100g": 6,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "lombo-porco:2-fatias",
        "label": {
          "pt": "2 fatias",
          "en": "2 slices"
        },
        "grams": 150,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 3,
    "exampleRank": 58,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Assado com laranja"
      ],
      "en": [
        "Roasted with orange"
      ]
    }
  },
  {
    "id": "peito-frango",
    "name": {
      "pt": "Peito de frango",
      "en": "Chicken breast"
    },
    "category": "carne",
    "role": "protein",
    "proteinPer100g": 23,
    "kcalPer100g": 107,
    "carbsPer100g": 0,
    "fatPer100g": 1.4,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "peito-frango:peito",
        "label": {
          "pt": "1 peito",
          "en": "1 breast"
        },
        "grams": 150,
        "default": true
      },
      {
        "id": "peito-frango:100g",
        "label": {
          "pt": "100 g",
          "en": "100 g"
        },
        "grams": 100
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 3,
    "exampleRank": 95,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Grelhado com limão e orégãos",
        "Em tiras, salteado com legumes"
      ],
      "en": [
        "Grilled with lemon and oregano",
        "In strips, stir-fried with vegetables"
      ]
    }
  },
  {
    "id": "peito-pato",
    "name": {
      "pt": "Peito de pato",
      "en": "Duck breast"
    },
    "category": "carne",
    "role": "protein",
    "proteinPer100g": 19,
    "kcalPer100g": 135,
    "carbsPer100g": 0,
    "fatPer100g": 6,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "peito-pato:peito",
        "label": {
          "pt": "1 peito",
          "en": "1 breast"
        },
        "grams": 180,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 3,
    "exampleRank": 25,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Com laranja e arroz"
      ],
      "en": [
        "With orange and rice"
      ]
    }
  },
  {
    "id": "peito-peru",
    "name": {
      "pt": "Peito de peru",
      "en": "Turkey breast"
    },
    "category": "carne",
    "role": "protein",
    "proteinPer100g": 22,
    "kcalPer100g": 105,
    "carbsPer100g": 0,
    "fatPer100g": 1,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "peito-peru:bife",
        "label": {
          "pt": "1 bife",
          "en": "1 steak"
        },
        "grams": 120,
        "default": true
      },
      {
        "id": "peito-peru:100g",
        "label": {
          "pt": "100 g",
          "en": "100 g"
        },
        "grams": 100
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 2,
    "exampleRank": 75,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Bife na frigideira em 6 minutos",
        "Em cubos, no caril"
      ],
      "en": [
        "Pan-fried steak in 6 minutes",
        "Diced, in a curry"
      ]
    }
  },
  {
    "id": "perna-borrego",
    "name": {
      "pt": "Perna de borrego",
      "en": "Leg of lamb"
    },
    "category": "carne",
    "role": "protein",
    "proteinPer100g": 19.5,
    "kcalPer100g": 190,
    "carbsPer100g": 0,
    "fatPer100g": 12,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "perna-borrego:dose",
        "label": {
          "pt": "1 dose",
          "en": "1 serving"
        },
        "grams": 150,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 3,
    "exampleRank": 30,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "No forno com alecrim"
      ],
      "en": [
        "Roasted with rosemary"
      ]
    }
  },
  {
    "id": "presunto",
    "name": {
      "pt": "Presunto curado",
      "en": "Cured ham"
    },
    "category": "carne",
    "role": "protein",
    "proteinPer100g": 30,
    "kcalPer100g": 250,
    "carbsPer100g": 0,
    "fatPer100g": 13,
    "weightBasis": "as_sold",
    "processing": "processed",
    "portions": [
      {
        "id": "presunto:3-fatias",
        "label": {
          "pt": "3 fatias finas",
          "en": "3 thin slices"
        },
        "grams": 30,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "lanche"
    ],
    "ease": 1,
    "exampleRank": 45,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Em pão com tomate"
      ],
      "en": [
        "On bread with tomato"
      ]
    }
  },
  {
    "id": "atum-fresco",
    "name": {
      "pt": "Atum fresco",
      "en": "Fresh tuna"
    },
    "category": "peixe",
    "role": "protein",
    "proteinPer100g": 23,
    "kcalPer100g": 110,
    "carbsPer100g": 0,
    "fatPer100g": 1.5,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "atum-fresco:posta",
        "label": {
          "pt": "1 posta",
          "en": "1 steak"
        },
        "grams": 150,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 2,
    "exampleRank": 60,
    "allergens": [
      "fish"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Selado com sésamo"
      ],
      "en": [
        "Seared with sesame"
      ]
    }
  },
  {
    "id": "bacalhau-demolhado",
    "name": {
      "pt": "Bacalhau demolhado",
      "en": "Soaked salt cod"
    },
    "category": "peixe",
    "role": "protein",
    "proteinPer100g": 19,
    "kcalPer100g": 85,
    "carbsPer100g": 0,
    "fatPer100g": 0.4,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "bacalhau-demolhado:posta",
        "label": {
          "pt": "1 posta",
          "en": "1 fillet"
        },
        "grams": 180,
        "default": true
      },
      {
        "id": "bacalhau-demolhado:100g",
        "label": {
          "pt": "100 g",
          "en": "100 g"
        },
        "grams": 100
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 3,
    "exampleRank": 55,
    "allergens": [
      "fish"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Cozido com grão e ovo",
        "Lascas com espinafres"
      ],
      "en": [
        "Boiled with chickpeas and egg",
        "Flaked with spinach"
      ]
    }
  },
  {
    "id": "carapau",
    "name": {
      "pt": "Carapau",
      "en": "Horse mackerel"
    },
    "category": "peixe",
    "role": "protein",
    "proteinPer100g": 19.5,
    "kcalPer100g": 130,
    "carbsPer100g": 0,
    "fatPer100g": 6,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "carapau:2-carapaus",
        "label": {
          "pt": "2 carapaus",
          "en": "2 fish"
        },
        "grams": 180,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 3,
    "exampleRank": 45,
    "allergens": [
      "fish"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Grelhado com batata cozida"
      ],
      "en": [
        "Grilled with boiled potato"
      ]
    }
  },
  {
    "id": "cavala",
    "name": {
      "pt": "Cavala",
      "en": "Mackerel"
    },
    "category": "peixe",
    "role": "protein",
    "proteinPer100g": 19,
    "kcalPer100g": 190,
    "carbsPer100g": 0,
    "fatPer100g": 13,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "cavala:cavala",
        "label": {
          "pt": "1 cavala",
          "en": "1 mackerel"
        },
        "grams": 160,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 3,
    "exampleRank": 42,
    "allergens": [
      "fish"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "No forno com limão"
      ],
      "en": [
        "Baked with lemon"
      ]
    }
  },
  {
    "id": "dourada",
    "name": {
      "pt": "Dourada",
      "en": "Sea bream"
    },
    "category": "peixe",
    "role": "protein",
    "proteinPer100g": 19.5,
    "kcalPer100g": 120,
    "carbsPer100g": 0,
    "fatPer100g": 5,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "dourada:dourada",
        "label": {
          "pt": "1 dourada",
          "en": "1 sea bream"
        },
        "grams": 180,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 3,
    "exampleRank": 52,
    "allergens": [
      "fish"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Grelhada com legumes"
      ],
      "en": [
        "Grilled with vegetables"
      ]
    }
  },
  {
    "id": "linguado",
    "name": {
      "pt": "Linguado",
      "en": "Sole"
    },
    "category": "peixe",
    "role": "protein",
    "proteinPer100g": 17,
    "kcalPer100g": 80,
    "carbsPer100g": 0,
    "fatPer100g": 1.5,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "linguado:filete",
        "label": {
          "pt": "1 filete",
          "en": "1 fillet"
        },
        "grams": 150,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 2,
    "exampleRank": 35,
    "allergens": [
      "fish"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Na frigideira com limão"
      ],
      "en": [
        "Pan-fried with lemon"
      ]
    }
  },
  {
    "id": "peixe-espada-preto",
    "name": {
      "pt": "Peixe-espada preto",
      "en": "Black scabbardfish"
    },
    "category": "peixe",
    "role": "protein",
    "proteinPer100g": 16,
    "kcalPer100g": 110,
    "carbsPer100g": 0,
    "fatPer100g": 6,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "peixe-espada-preto:filete",
        "label": {
          "pt": "1 filete",
          "en": "1 fillet"
        },
        "grams": 150,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 3,
    "exampleRank": 38,
    "allergens": [
      "fish"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Com banana, à madeirense"
      ],
      "en": [
        "Madeira style, with banana"
      ]
    }
  },
  {
    "id": "pescada",
    "name": {
      "pt": "Pescada",
      "en": "Hake"
    },
    "category": "peixe",
    "role": "protein",
    "proteinPer100g": 16.5,
    "kcalPer100g": 75,
    "carbsPer100g": 0,
    "fatPer100g": 0.8,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "pescada:posta",
        "label": {
          "pt": "1 posta",
          "en": "1 fillet"
        },
        "grams": 150,
        "default": true
      },
      {
        "id": "pescada:100g",
        "label": {
          "pt": "100 g",
          "en": "100 g"
        },
        "grams": 100
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 3,
    "exampleRank": 65,
    "allergens": [
      "fish"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Cozida com legumes e um fio de azeite",
        "No forno com tomate"
      ],
      "en": [
        "Poached with vegetables and olive oil",
        "Baked with tomato"
      ]
    }
  },
  {
    "id": "robalo",
    "name": {
      "pt": "Robalo",
      "en": "Sea bass"
    },
    "category": "peixe",
    "role": "protein",
    "proteinPer100g": 19,
    "kcalPer100g": 105,
    "carbsPer100g": 0,
    "fatPer100g": 3.5,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "robalo:robalo",
        "label": {
          "pt": "1 robalo",
          "en": "1 sea bass"
        },
        "grams": 180,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 3,
    "exampleRank": 50,
    "allergens": [
      "fish"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "No forno com batata-doce"
      ],
      "en": [
        "Baked with sweet potato"
      ]
    }
  },
  {
    "id": "salmao",
    "name": {
      "pt": "Salmão",
      "en": "Salmon"
    },
    "category": "peixe",
    "role": "protein",
    "proteinPer100g": 20,
    "kcalPer100g": 202,
    "carbsPer100g": 0,
    "fatPer100g": 13,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "salmao:posta",
        "label": {
          "pt": "1 posta",
          "en": "1 fillet"
        },
        "grams": 150,
        "default": true
      },
      {
        "id": "salmao:100g",
        "label": {
          "pt": "100 g",
          "en": "100 g"
        },
        "grams": 100
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 2,
    "exampleRank": 82,
    "allergens": [
      "fish"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "No forno com batata-doce",
        "Na frigideira, pele para baixo"
      ],
      "en": [
        "Baked with sweet potato",
        "Pan-seared, skin side down"
      ]
    }
  },
  {
    "id": "sardinha",
    "name": {
      "pt": "Sardinha",
      "en": "Sardine"
    },
    "category": "peixe",
    "role": "protein",
    "proteinPer100g": 20,
    "kcalPer100g": 170,
    "carbsPer100g": 0,
    "fatPer100g": 10,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "sardinha:3-sardinhas",
        "label": {
          "pt": "3 sardinhas",
          "en": "3 sardines"
        },
        "grams": 150,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 3,
    "exampleRank": 50,
    "allergens": [
      "fish"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Assadas com pimentos"
      ],
      "en": [
        "Grilled with peppers"
      ]
    }
  },
  {
    "id": "tamboril",
    "name": {
      "pt": "Tamboril",
      "en": "Monkfish"
    },
    "category": "peixe",
    "role": "protein",
    "proteinPer100g": 15,
    "kcalPer100g": 70,
    "carbsPer100g": 0,
    "fatPer100g": 0.6,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "tamboril:dose",
        "label": {
          "pt": "1 dose",
          "en": "1 serving"
        },
        "grams": 150,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 3,
    "exampleRank": 30,
    "allergens": [
      "fish"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Em arroz de tamboril"
      ],
      "en": [
        "In monkfish rice"
      ]
    }
  },
  {
    "id": "truta",
    "name": {
      "pt": "Truta",
      "en": "Trout"
    },
    "category": "peixe",
    "role": "protein",
    "proteinPer100g": 20,
    "kcalPer100g": 135,
    "carbsPer100g": 0,
    "fatPer100g": 6,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "truta:truta",
        "label": {
          "pt": "1 truta",
          "en": "1 trout"
        },
        "grams": 180,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 3,
    "exampleRank": 40,
    "allergens": [
      "fish"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "No forno com amêndoa"
      ],
      "en": [
        "Baked with almonds"
      ]
    }
  },
  {
    "id": "ameijoas",
    "name": {
      "pt": "Amêijoas",
      "en": "Clams"
    },
    "category": "marisco",
    "role": "protein",
    "proteinPer100g": 12.5,
    "kcalPer100g": 75,
    "carbsPer100g": 2.6,
    "fatPer100g": 1,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "ameijoas:dose",
        "label": {
          "pt": "1 dose (miolo)",
          "en": "1 serving (meat)"
        },
        "grams": 120,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 2,
    "exampleRank": 28,
    "allergens": [
      "shellfish"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "À bulhão pato"
      ],
      "en": [
        "With garlic and coriander"
      ]
    }
  },
  {
    "id": "camarao",
    "name": {
      "pt": "Camarão",
      "en": "Prawns"
    },
    "category": "marisco",
    "role": "protein",
    "proteinPer100g": 18,
    "kcalPer100g": 77,
    "carbsPer100g": 0,
    "fatPer100g": 0.6,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "camarao:dose",
        "label": {
          "pt": "1 dose (descascado)",
          "en": "1 serving (peeled)"
        },
        "grams": 120,
        "default": true
      },
      {
        "id": "camarao:100g",
        "label": {
          "pt": "100 g",
          "en": "100 g"
        },
        "grams": 100
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 2,
    "exampleRank": 50,
    "allergens": [
      "shellfish"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Salteado com alho em 5 minutos",
        "Com massa e limão"
      ],
      "en": [
        "Sautéed with garlic in 5 minutes",
        "With pasta and lemon"
      ]
    }
  },
  {
    "id": "choco",
    "name": {
      "pt": "Choco",
      "en": "Cuttlefish"
    },
    "category": "marisco",
    "role": "protein",
    "proteinPer100g": 16,
    "kcalPer100g": 80,
    "carbsPer100g": 0.8,
    "fatPer100g": 0.7,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "choco:dose",
        "label": {
          "pt": "1 dose",
          "en": "1 serving"
        },
        "grams": 150,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 2,
    "exampleRank": 36,
    "allergens": [
      "shellfish"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Grelhado com batata"
      ],
      "en": [
        "Grilled with potato"
      ]
    }
  },
  {
    "id": "lulas",
    "name": {
      "pt": "Lulas",
      "en": "Squid"
    },
    "category": "marisco",
    "role": "protein",
    "proteinPer100g": 16,
    "kcalPer100g": 85,
    "carbsPer100g": 2,
    "fatPer100g": 1.3,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "lulas:dose",
        "label": {
          "pt": "1 dose",
          "en": "1 serving"
        },
        "grams": 150,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 2,
    "exampleRank": 38,
    "allergens": [
      "shellfish"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Grelhadas com alho"
      ],
      "en": [
        "Grilled with garlic"
      ]
    }
  },
  {
    "id": "mexilhao",
    "name": {
      "pt": "Mexilhão",
      "en": "Mussels"
    },
    "category": "marisco",
    "role": "protein",
    "proteinPer100g": 12,
    "kcalPer100g": 85,
    "carbsPer100g": 3.7,
    "fatPer100g": 2.2,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "mexilhao:dose",
        "label": {
          "pt": "1 dose (miolo)",
          "en": "1 serving (meat)"
        },
        "grams": 150,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 2,
    "exampleRank": 30,
    "allergens": [
      "shellfish"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "À bulhão pato"
      ],
      "en": [
        "With garlic and coriander"
      ]
    }
  },
  {
    "id": "polvo",
    "name": {
      "pt": "Polvo",
      "en": "Octopus"
    },
    "category": "marisco",
    "role": "protein",
    "proteinPer100g": 22,
    "kcalPer100g": 120,
    "carbsPer100g": 2,
    "fatPer100g": 1.5,
    "weightBasis": "cooked",
    "processing": "natural",
    "portions": [
      {
        "id": "polvo:dose",
        "label": {
          "pt": "1 dose (cozido)",
          "en": "1 serving (cooked)"
        },
        "grams": 150,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 3,
    "exampleRank": 40,
    "allergens": [
      "shellfish"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Salada de polvo"
      ],
      "en": [
        "Octopus salad"
      ]
    }
  },
  {
    "id": "atum-lata-azeite",
    "name": {
      "pt": "Atum em lata em azeite",
      "en": "Canned tuna in olive oil"
    },
    "category": "conservas",
    "role": "protein",
    "proteinPer100g": 25,
    "kcalPer100g": 190,
    "carbsPer100g": 0,
    "fatPer100g": 9,
    "weightBasis": "as_sold",
    "processing": "processed",
    "portions": [
      {
        "id": "atum-lata-azeite:lata",
        "label": {
          "pt": "1 lata (escorrida)",
          "en": "1 can (drained)"
        },
        "grams": 60,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "lanche",
      "jantar"
    ],
    "ease": 1,
    "exampleRank": 70,
    "allergens": [
      "fish"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Com feijão-frade e cebola"
      ],
      "en": [
        "With black-eyed peas and onion"
      ]
    }
  },
  {
    "id": "atum-lata-natural",
    "name": {
      "pt": "Atum em lata ao natural",
      "en": "Canned tuna in water"
    },
    "category": "conservas",
    "role": "protein",
    "proteinPer100g": 25,
    "kcalPer100g": 110,
    "carbsPer100g": 0,
    "fatPer100g": 1,
    "weightBasis": "as_sold",
    "processing": "processed",
    "portions": [
      {
        "id": "atum-lata-natural:lata",
        "label": {
          "pt": "1 lata (escorrida)",
          "en": "1 can (drained)"
        },
        "grams": 60,
        "default": true
      },
      {
        "id": "atum-lata-natural:lata-grande",
        "label": {
          "pt": "1 lata grande (escorrida)",
          "en": "1 large can (drained)"
        },
        "grams": 90
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 1,
    "exampleRank": 78,
    "allergens": [
      "fish"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Salada de grão com atum",
        "Sandes com tomate"
      ],
      "en": [
        "Chickpea and tuna salad",
        "Sandwich with tomato"
      ]
    }
  },
  {
    "id": "cavala-lata",
    "name": {
      "pt": "Cavala em lata",
      "en": "Canned mackerel"
    },
    "category": "conservas",
    "role": "protein",
    "proteinPer100g": 21,
    "kcalPer100g": 200,
    "carbsPer100g": 0,
    "fatPer100g": 12,
    "weightBasis": "as_sold",
    "processing": "processed",
    "portions": [
      {
        "id": "cavala-lata:lata",
        "label": {
          "pt": "1 lata (escorrida)",
          "en": "1 can (drained)"
        },
        "grams": 85,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "lanche",
      "jantar"
    ],
    "ease": 1,
    "exampleRank": 45,
    "allergens": [
      "fish"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Em tosta com tomate"
      ],
      "en": [
        "On toast with tomato"
      ]
    }
  },
  {
    "id": "mexilhao-conserva",
    "name": {
      "pt": "Mexilhão em conserva",
      "en": "Canned mussels"
    },
    "category": "conservas",
    "role": "protein",
    "proteinPer100g": 17,
    "kcalPer100g": 160,
    "carbsPer100g": 4,
    "fatPer100g": 8,
    "weightBasis": "as_sold",
    "processing": "processed",
    "portions": [
      {
        "id": "mexilhao-conserva:lata",
        "label": {
          "pt": "1 lata (escorrida)",
          "en": "1 can (drained)"
        },
        "grams": 70,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "lanche",
      "jantar"
    ],
    "ease": 1,
    "exampleRank": 30,
    "allergens": [
      "shellfish"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Com arroz e salsa"
      ],
      "en": [
        "With rice and parsley"
      ]
    }
  },
  {
    "id": "salmao-fumado",
    "name": {
      "pt": "Salmão fumado",
      "en": "Smoked salmon"
    },
    "category": "conservas",
    "role": "protein",
    "proteinPer100g": 21,
    "kcalPer100g": 160,
    "carbsPer100g": 0,
    "fatPer100g": 8,
    "weightBasis": "as_sold",
    "processing": "processed",
    "portions": [
      {
        "id": "salmao-fumado:fatias",
        "label": {
          "pt": "3 fatias",
          "en": "3 slices"
        },
        "grams": 60,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "almoco",
      "lanche",
      "jantar"
    ],
    "ease": 1,
    "exampleRank": 40,
    "allergens": [
      "fish"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Em pão com queijo fresco",
        "Com ovos mexidos"
      ],
      "en": [
        "On bread with fresh cheese",
        "With scrambled eggs"
      ]
    }
  },
  {
    "id": "sardinhas-lata",
    "name": {
      "pt": "Sardinhas em lata",
      "en": "Canned sardines"
    },
    "category": "conservas",
    "role": "protein",
    "proteinPer100g": 24,
    "kcalPer100g": 208,
    "carbsPer100g": 0,
    "fatPer100g": 11.5,
    "weightBasis": "as_sold",
    "processing": "processed",
    "portions": [
      {
        "id": "sardinhas-lata:lata",
        "label": {
          "pt": "1 lata (escorrida)",
          "en": "1 can (drained)"
        },
        "grams": 85,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "lanche",
      "jantar"
    ],
    "ease": 1,
    "exampleRank": 60,
    "allergens": [
      "fish"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Em tosta com tomate",
        "Com batata cozida e cebola"
      ],
      "en": [
        "On toast with tomato",
        "With boiled potato and onion"
      ]
    }
  },
  {
    "id": "claras-ovo",
    "name": {
      "pt": "Claras de ovo",
      "en": "Egg whites"
    },
    "category": "ovos",
    "role": "protein",
    "proteinPer100g": 10.9,
    "kcalPer100g": 52,
    "carbsPer100g": 0.7,
    "fatPer100g": 0.2,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "claras-ovo:3-claras",
        "label": {
          "pt": "3 claras",
          "en": "3 egg whites"
        },
        "grams": 100,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "almoco",
      "jantar"
    ],
    "ease": 2,
    "exampleRank": 35,
    "allergens": [
      "egg"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Omelete com um ovo inteiro",
        "Panquecas de aveia"
      ],
      "en": [
        "Omelette with one whole egg",
        "Oat pancakes"
      ]
    }
  },
  {
    "id": "ovo",
    "name": {
      "pt": "Ovo",
      "en": "Egg"
    },
    "category": "ovos",
    "role": "protein",
    "proteinPer100g": 12.6,
    "kcalPer100g": 143,
    "carbsPer100g": 0.7,
    "fatPer100g": 9.5,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "ovo:ovo",
        "label": {
          "pt": "1 ovo médio",
          "en": "1 medium egg"
        },
        "grams": 50,
        "default": true
      },
      {
        "id": "ovo:2-ovos",
        "label": {
          "pt": "2 ovos",
          "en": "2 eggs"
        },
        "grams": 100
      }
    ],
    "moments": [
      "pequeno-almoco",
      "almoco",
      "lanche",
      "jantar"
    ],
    "ease": 2,
    "exampleRank": 85,
    "allergens": [
      "egg"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Cozido (10 minutos) para levar",
        "Mexido com espinafres"
      ],
      "en": [
        "Hard-boiled (10 minutes) to go",
        "Scrambled with spinach"
      ]
    }
  },
  {
    "id": "ovos-codorniz",
    "name": {
      "pt": "Ovos de codorniz",
      "en": "Quail eggs"
    },
    "category": "ovos",
    "role": "protein",
    "proteinPer100g": 13,
    "kcalPer100g": 158,
    "carbsPer100g": 0.4,
    "fatPer100g": 11,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "ovos-codorniz:5-ovos",
        "label": {
          "pt": "5 ovos",
          "en": "5 eggs"
        },
        "grams": 50,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "almoco",
      "lanche",
      "jantar"
    ],
    "ease": 2,
    "exampleRank": 30,
    "allergens": [
      "egg"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Cozidos, em salada"
      ],
      "en": [
        "Boiled, in a salad"
      ]
    }
  },
  {
    "id": "iogurte-grego-natural",
    "name": {
      "pt": "Iogurte grego natural",
      "en": "Plain Greek yogurt"
    },
    "category": "laticinios",
    "role": "protein",
    "proteinPer100g": 9,
    "kcalPer100g": 93,
    "carbsPer100g": 3,
    "fatPer100g": 5,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "iogurte-grego-natural:iogurte",
        "label": {
          "pt": "1 iogurte",
          "en": "1 pot"
        },
        "grams": 125,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "lanche",
      "ceia"
    ],
    "ease": 1,
    "exampleRank": 80,
    "allergens": [
      "milk"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Com fruta e amêndoa",
        "Molho com pepino e alho"
      ],
      "en": [
        "With fruit and almonds",
        "Dip with cucumber and garlic"
      ]
    }
  },
  {
    "id": "iogurte-natural",
    "name": {
      "pt": "Iogurte natural",
      "en": "Plain yogurt"
    },
    "category": "laticinios",
    "role": "protein",
    "proteinPer100g": 4.2,
    "kcalPer100g": 62,
    "carbsPer100g": 5.5,
    "fatPer100g": 3,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "iogurte-natural:iogurte",
        "label": {
          "pt": "1 iogurte",
          "en": "1 pot"
        },
        "grams": 125,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "lanche",
      "ceia"
    ],
    "ease": 1,
    "exampleRank": 55,
    "allergens": [
      "milk"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Com fruta"
      ],
      "en": [
        "With fruit"
      ]
    }
  },
  {
    "id": "kefir-natural",
    "name": {
      "pt": "Kefir natural",
      "en": "Plain kefir"
    },
    "category": "laticinios",
    "role": "protein",
    "proteinPer100g": 3.5,
    "kcalPer100g": 60,
    "carbsPer100g": 4.5,
    "fatPer100g": 3,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "kefir-natural:copo",
        "label": {
          "pt": "1 copo",
          "en": "1 glass"
        },
        "grams": 250,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "lanche",
      "ceia"
    ],
    "ease": 1,
    "exampleRank": 45,
    "allergens": [
      "milk"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Batido com fruta"
      ],
      "en": [
        "Shake with fruit"
      ]
    }
  },
  {
    "id": "leite-magro",
    "name": {
      "pt": "Leite magro",
      "en": "Skimmed milk"
    },
    "category": "laticinios",
    "role": "protein",
    "proteinPer100g": 3.4,
    "kcalPer100g": 34,
    "carbsPer100g": 4.8,
    "fatPer100g": 0.1,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "leite-magro:copo",
        "label": {
          "pt": "1 copo",
          "en": "1 glass"
        },
        "grams": 250,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "lanche",
      "ceia"
    ],
    "ease": 1,
    "exampleRank": 58,
    "allergens": [
      "milk"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Com aveia"
      ],
      "en": [
        "With oats"
      ]
    }
  },
  {
    "id": "leite-meio-gordo",
    "name": {
      "pt": "Leite meio-gordo",
      "en": "Semi-skimmed milk"
    },
    "category": "laticinios",
    "role": "protein",
    "proteinPer100g": 3.3,
    "kcalPer100g": 47,
    "carbsPer100g": 4.8,
    "fatPer100g": 1.6,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "leite-meio-gordo:copo",
        "label": {
          "pt": "1 copo",
          "en": "1 glass"
        },
        "grams": 250,
        "default": true
      },
      {
        "id": "leite-meio-gordo:chavena",
        "label": {
          "pt": "1 chávena",
          "en": "1 cup"
        },
        "grams": 200
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "lanche",
      "ceia"
    ],
    "ease": 1,
    "exampleRank": 60,
    "allergens": [
      "milk"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Com aveia e canela",
        "Batido com banana"
      ],
      "en": [
        "With oats and cinnamon",
        "Shake with banana"
      ]
    }
  },
  {
    "id": "mozzarella-fresca",
    "name": {
      "pt": "Mozzarella fresca",
      "en": "Fresh mozzarella"
    },
    "category": "laticinios",
    "role": "protein",
    "proteinPer100g": 18,
    "kcalPer100g": 250,
    "carbsPer100g": 1,
    "fatPer100g": 19,
    "weightBasis": "as_sold",
    "processing": "processed",
    "portions": [
      {
        "id": "mozzarella-fresca:meia-bola",
        "label": {
          "pt": "Meia bola",
          "en": "Half a ball"
        },
        "grams": 60,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "almoco",
      "lanche",
      "jantar"
    ],
    "ease": 1,
    "exampleRank": 40,
    "allergens": [
      "milk"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Com tomate e manjericão"
      ],
      "en": [
        "With tomato and basil"
      ]
    }
  },
  {
    "id": "parmesao",
    "name": {
      "pt": "Parmesão ou Grana Padano",
      "en": "Parmesan or Grana Padano"
    },
    "category": "laticinios",
    "role": "protein",
    "proteinPer100g": 33,
    "kcalPer100g": 400,
    "carbsPer100g": 0,
    "fatPer100g": 29,
    "weightBasis": "as_sold",
    "processing": "processed",
    "portions": [
      {
        "id": "parmesao:colher",
        "label": {
          "pt": "1 colher de sopa (ralado)",
          "en": "1 tablespoon (grated)"
        },
        "grams": 10,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 1,
    "exampleRank": 20,
    "allergens": [
      "milk"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Por cima da massa"
      ],
      "en": [
        "Over pasta"
      ]
    }
  },
  {
    "id": "quark-natural",
    "name": {
      "pt": "Quark natural",
      "en": "Plain quark"
    },
    "category": "laticinios",
    "role": "protein",
    "proteinPer100g": 12,
    "kcalPer100g": 70,
    "carbsPer100g": 4,
    "fatPer100g": 0.3,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "quark-natural:embalagem",
        "label": {
          "pt": "1 embalagem pequena",
          "en": "1 small tub"
        },
        "grams": 200,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "lanche",
      "ceia"
    ],
    "ease": 1,
    "exampleRank": 75,
    "allergens": [
      "milk"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Com mirtilos e mel"
      ],
      "en": [
        "With blueberries and honey"
      ]
    }
  },
  {
    "id": "queijo-cabra-curado",
    "name": {
      "pt": "Queijo de cabra curado",
      "en": "Aged goat cheese"
    },
    "category": "laticinios",
    "role": "protein",
    "proteinPer100g": 25,
    "kcalPer100g": 360,
    "carbsPer100g": 0,
    "fatPer100g": 29,
    "weightBasis": "as_sold",
    "processing": "processed",
    "portions": [
      {
        "id": "queijo-cabra-curado:2-fatias",
        "label": {
          "pt": "2 fatias",
          "en": "2 slices"
        },
        "grams": 30,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "lanche"
    ],
    "ease": 1,
    "exampleRank": 25,
    "allergens": [
      "milk"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Com figos"
      ],
      "en": [
        "With figs"
      ]
    }
  },
  {
    "id": "queijo-cottage",
    "name": {
      "pt": "Queijo cottage",
      "en": "Cottage cheese"
    },
    "category": "laticinios",
    "role": "protein",
    "proteinPer100g": 12,
    "kcalPer100g": 98,
    "carbsPer100g": 3.4,
    "fatPer100g": 4.3,
    "weightBasis": "as_sold",
    "processing": "processed",
    "portions": [
      {
        "id": "queijo-cottage:meia-embalagem",
        "label": {
          "pt": "Meia embalagem",
          "en": "Half a tub"
        },
        "grams": 100,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "almoco",
      "lanche",
      "ceia"
    ],
    "ease": 1,
    "exampleRank": 50,
    "allergens": [
      "milk"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Com tomate e orégãos",
        "Em salada com grão"
      ],
      "en": [
        "With tomato and oregano",
        "In a chickpea salad"
      ]
    }
  },
  {
    "id": "queijo-flamengo",
    "name": {
      "pt": "Queijo flamengo",
      "en": "Edam cheese"
    },
    "category": "laticinios",
    "role": "protein",
    "proteinPer100g": 25,
    "kcalPer100g": 340,
    "carbsPer100g": 0.5,
    "fatPer100g": 26,
    "weightBasis": "as_sold",
    "processing": "processed",
    "portions": [
      {
        "id": "queijo-flamengo:2-fatias",
        "label": {
          "pt": "2 fatias",
          "en": "2 slices"
        },
        "grams": 40,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "lanche"
    ],
    "ease": 1,
    "exampleRank": 55,
    "allergens": [
      "milk"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Tosta com fiambre de peru",
        "Em pão integral"
      ],
      "en": [
        "Toastie with turkey ham",
        "On wholemeal bread"
      ]
    }
  },
  {
    "id": "queijo-fresco",
    "name": {
      "pt": "Queijo fresco",
      "en": "Fresh cheese"
    },
    "category": "laticinios",
    "role": "protein",
    "proteinPer100g": 11,
    "kcalPer100g": 155,
    "carbsPer100g": 3,
    "fatPer100g": 10.5,
    "weightBasis": "as_sold",
    "processing": "processed",
    "portions": [
      {
        "id": "queijo-fresco:queijo",
        "label": {
          "pt": "1 queijo pequeno",
          "en": "1 small cheese"
        },
        "grams": 100,
        "default": true
      },
      {
        "id": "queijo-fresco:fatia",
        "label": {
          "pt": "1 fatia",
          "en": "1 slice"
        },
        "grams": 30
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "lanche",
      "ceia"
    ],
    "ease": 1,
    "exampleRank": 70,
    "allergens": [
      "milk"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Em pão com tomate",
        "Com mel e nozes"
      ],
      "en": [
        "On bread with tomato",
        "With honey and walnuts"
      ]
    }
  },
  {
    "id": "queijo-sao-jorge",
    "name": {
      "pt": "Queijo da Ilha (São Jorge)",
      "en": "São Jorge cheese"
    },
    "category": "laticinios",
    "role": "protein",
    "proteinPer100g": 26,
    "kcalPer100g": 380,
    "carbsPer100g": 0,
    "fatPer100g": 31,
    "weightBasis": "as_sold",
    "processing": "processed",
    "portions": [
      {
        "id": "queijo-sao-jorge:fatia",
        "label": {
          "pt": "1 fatia grossa",
          "en": "1 thick slice"
        },
        "grams": 30,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "lanche"
    ],
    "ease": 1,
    "exampleRank": 35,
    "allergens": [
      "milk"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Em pão de mistura"
      ],
      "en": [
        "On mixed-grain bread"
      ]
    }
  },
  {
    "id": "requeijao",
    "name": {
      "pt": "Requeijão",
      "en": "Requeijão (whey cheese)"
    },
    "category": "laticinios",
    "role": "protein",
    "proteinPer100g": 10,
    "kcalPer100g": 120,
    "carbsPer100g": 3.5,
    "fatPer100g": 6.5,
    "weightBasis": "as_sold",
    "processing": "processed",
    "portions": [
      {
        "id": "requeijao:meio",
        "label": {
          "pt": "Meio requeijão",
          "en": "Half a requeijão"
        },
        "grams": 100,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "lanche",
      "ceia"
    ],
    "ease": 1,
    "exampleRank": 65,
    "allergens": [
      "milk"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Com doce de abóbora",
        "Em pão de mistura"
      ],
      "en": [
        "With pumpkin jam",
        "On mixed-grain bread"
      ]
    }
  },
  {
    "id": "ricota",
    "name": {
      "pt": "Ricota",
      "en": "Ricotta"
    },
    "category": "laticinios",
    "role": "protein",
    "proteinPer100g": 11,
    "kcalPer100g": 150,
    "carbsPer100g": 3,
    "fatPer100g": 10,
    "weightBasis": "as_sold",
    "processing": "processed",
    "portions": [
      {
        "id": "ricota:2-colheres",
        "label": {
          "pt": "2 colheres de sopa",
          "en": "2 tablespoons"
        },
        "grams": 50,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "almoco",
      "lanche"
    ],
    "ease": 1,
    "exampleRank": 35,
    "allergens": [
      "milk"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Em tosta com mel"
      ],
      "en": [
        "On toast with honey"
      ]
    }
  },
  {
    "id": "skyr-natural",
    "name": {
      "pt": "Skyr natural",
      "en": "Plain skyr"
    },
    "category": "laticinios",
    "role": "protein",
    "proteinPer100g": 11,
    "kcalPer100g": 63,
    "carbsPer100g": 4,
    "fatPer100g": 0.2,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "skyr-natural:iogurte",
        "label": {
          "pt": "1 iogurte",
          "en": "1 pot"
        },
        "grams": 150,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "lanche",
      "ceia"
    ],
    "ease": 1,
    "exampleRank": 90,
    "allergens": [
      "milk"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Com morangos e aveia",
        "Com mel e canela"
      ],
      "en": [
        "With strawberries and oats",
        "With honey and cinnamon"
      ]
    }
  },
  {
    "id": "whey-sem-sabor",
    "name": {
      "pt": "Proteína whey sem sabor",
      "en": "Unflavoured whey protein"
    },
    "category": "suplementos",
    "role": "protein",
    "proteinPer100g": 80,
    "kcalPer100g": 380,
    "carbsPer100g": 7,
    "fatPer100g": 6,
    "weightBasis": "as_sold",
    "processing": "ultra",
    "portions": [
      {
        "id": "whey-sem-sabor:dose",
        "label": {
          "pt": "1 dose (scoop)",
          "en": "1 scoop"
        },
        "grams": 30,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "lanche",
      "ceia"
    ],
    "ease": 1,
    "exampleRank": 10,
    "allergens": [
      "milk"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Batido com leite e banana",
        "Misturada nas papas de aveia"
      ],
      "en": [
        "Shake with milk and banana",
        "Stirred into porridge"
      ]
    }
  },
  {
    "id": "edamame",
    "name": {
      "pt": "Edamame",
      "en": "Edamame"
    },
    "category": "soja",
    "role": "protein",
    "proteinPer100g": 11.5,
    "kcalPer100g": 122,
    "carbsPer100g": 9,
    "fatPer100g": 5.2,
    "weightBasis": "cooked",
    "processing": "natural",
    "portions": [
      {
        "id": "edamame:chavena",
        "label": {
          "pt": "1 chávena (sem casca)",
          "en": "1 cup (shelled)"
        },
        "grams": 150,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "lanche",
      "jantar"
    ],
    "ease": 2,
    "exampleRank": 30,
    "allergens": [
      "soy"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Com sal e limão",
        "Em salada de arroz"
      ],
      "en": [
        "With salt and lemon",
        "In a rice salad"
      ]
    }
  },
  {
    "id": "soja-grao",
    "name": {
      "pt": "Soja em grão",
      "en": "Soybeans"
    },
    "category": "soja",
    "role": "protein",
    "proteinPer100g": 16.6,
    "kcalPer100g": 170,
    "carbsPer100g": 8,
    "fatPer100g": 9,
    "weightBasis": "cooked",
    "processing": "natural",
    "portions": [
      {
        "id": "soja-grao:chavena",
        "label": {
          "pt": "1 chávena (cozida)",
          "en": "1 cup (cooked)"
        },
        "grams": 170,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 2,
    "exampleRank": 25,
    "allergens": [
      "soy"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Em salada morna"
      ],
      "en": [
        "In a warm salad"
      ]
    }
  },
  {
    "id": "tempeh",
    "name": {
      "pt": "Tempeh",
      "en": "Tempeh"
    },
    "category": "soja",
    "role": "protein",
    "proteinPer100g": 19,
    "kcalPer100g": 190,
    "carbsPer100g": 9,
    "fatPer100g": 11,
    "weightBasis": "as_sold",
    "processing": "processed",
    "portions": [
      {
        "id": "tempeh:meio-bloco",
        "label": {
          "pt": "Meio bloco",
          "en": "Half a block"
        },
        "grams": 100,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 2,
    "exampleRank": 35,
    "allergens": [
      "soy"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Salteado com legumes"
      ],
      "en": [
        "Stir-fried with vegetables"
      ]
    }
  },
  {
    "id": "tofu-firme",
    "name": {
      "pt": "Tofu firme",
      "en": "Firm tofu"
    },
    "category": "soja",
    "role": "protein",
    "proteinPer100g": 13,
    "kcalPer100g": 130,
    "carbsPer100g": 2,
    "fatPer100g": 7.5,
    "weightBasis": "as_sold",
    "processing": "processed",
    "portions": [
      {
        "id": "tofu-firme:meio-bloco",
        "label": {
          "pt": "Meio bloco",
          "en": "Half a block"
        },
        "grams": 125,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 2,
    "exampleRank": 45,
    "allergens": [
      "soy"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Em cubos, salteado com soja e alho",
        "No forno com legumes"
      ],
      "en": [
        "Cubed, stir-fried with soy and garlic",
        "Baked with vegetables"
      ]
    }
  },
  {
    "id": "ervilhas",
    "name": {
      "pt": "Ervilhas",
      "en": "Peas"
    },
    "category": "leguminosas",
    "role": "protein",
    "proteinPer100g": 5.4,
    "kcalPer100g": 80,
    "carbsPer100g": 14,
    "fatPer100g": 0.4,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "ervilhas:chavena",
        "label": {
          "pt": "1 chávena",
          "en": "1 cup"
        },
        "grams": 150,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 2,
    "exampleRank": 30,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Com ovos escalfados"
      ],
      "en": [
        "With poached eggs"
      ]
    }
  },
  {
    "id": "favas",
    "name": {
      "pt": "Favas",
      "en": "Broad beans"
    },
    "category": "leguminosas",
    "role": "protein",
    "proteinPer100g": 7.6,
    "kcalPer100g": 88,
    "carbsPer100g": 12,
    "fatPer100g": 0.7,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "favas:chavena",
        "label": {
          "pt": "1 chávena",
          "en": "1 cup"
        },
        "grams": 150,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 2,
    "exampleRank": 20,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Guisadas com coentros"
      ],
      "en": [
        "Stewed with coriander"
      ]
    }
  },
  {
    "id": "feijao-branco",
    "name": {
      "pt": "Feijão-branco",
      "en": "White beans"
    },
    "category": "leguminosas",
    "role": "protein",
    "proteinPer100g": 9.7,
    "kcalPer100g": 140,
    "carbsPer100g": 25,
    "fatPer100g": 0.4,
    "weightBasis": "cooked",
    "processing": "natural",
    "portions": [
      {
        "id": "feijao-branco:chavena",
        "label": {
          "pt": "1 chávena (cozido)",
          "en": "1 cup (cooked)"
        },
        "grams": 170,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 3,
    "exampleRank": 36,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Em sopa"
      ],
      "en": [
        "In a soup"
      ]
    }
  },
  {
    "id": "feijao-encarnado",
    "name": {
      "pt": "Feijão-encarnado",
      "en": "Red kidney beans"
    },
    "category": "leguminosas",
    "role": "protein",
    "proteinPer100g": 8.7,
    "kcalPer100g": 127,
    "carbsPer100g": 23,
    "fatPer100g": 0.5,
    "weightBasis": "cooked",
    "processing": "natural",
    "portions": [
      {
        "id": "feijao-encarnado:chavena",
        "label": {
          "pt": "1 chávena (cozido)",
          "en": "1 cup (cooked)"
        },
        "grams": 170,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 3,
    "exampleRank": 36,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Chili caseiro"
      ],
      "en": [
        "Homemade chili"
      ]
    }
  },
  {
    "id": "feijao-frade",
    "name": {
      "pt": "Feijão-frade",
      "en": "Black-eyed peas"
    },
    "category": "leguminosas",
    "role": "protein",
    "proteinPer100g": 7.7,
    "kcalPer100g": 116,
    "carbsPer100g": 21,
    "fatPer100g": 0.5,
    "weightBasis": "cooked",
    "processing": "natural",
    "portions": [
      {
        "id": "feijao-frade:chavena",
        "label": {
          "pt": "1 chávena (cozido)",
          "en": "1 cup (cooked)"
        },
        "grams": 170,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 3,
    "exampleRank": 30,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Salada com atum"
      ],
      "en": [
        "Salad with tuna"
      ]
    }
  },
  {
    "id": "feijao-lata",
    "name": {
      "pt": "Feijão em lata",
      "en": "Canned beans"
    },
    "category": "leguminosas",
    "role": "protein",
    "proteinPer100g": 6.5,
    "kcalPer100g": 100,
    "carbsPer100g": 15,
    "fatPer100g": 0.5,
    "weightBasis": "as_sold",
    "processing": "processed",
    "portions": [
      {
        "id": "feijao-lata:meia-lata",
        "label": {
          "pt": "Meia lata (escorrida)",
          "en": "Half a can (drained)"
        },
        "grams": 120,
        "default": true
      },
      {
        "id": "feijao-lata:lata",
        "label": {
          "pt": "1 lata (escorrida)",
          "en": "1 can (drained)"
        },
        "grams": 240
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 1,
    "exampleRank": 45,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Com arroz e ovo",
        "Chili rápido"
      ],
      "en": [
        "With rice and egg",
        "Quick chili"
      ]
    }
  },
  {
    "id": "feijao-preto",
    "name": {
      "pt": "Feijão-preto",
      "en": "Black beans"
    },
    "category": "leguminosas",
    "role": "protein",
    "proteinPer100g": 8.9,
    "kcalPer100g": 132,
    "carbsPer100g": 24,
    "fatPer100g": 0.5,
    "weightBasis": "cooked",
    "processing": "natural",
    "portions": [
      {
        "id": "feijao-preto:chavena",
        "label": {
          "pt": "1 chávena (cozido)",
          "en": "1 cup (cooked)"
        },
        "grams": 170,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 3,
    "exampleRank": 38,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Com arroz"
      ],
      "en": [
        "With rice"
      ]
    }
  },
  {
    "id": "grao-bico",
    "name": {
      "pt": "Grão-de-bico",
      "en": "Chickpeas"
    },
    "category": "leguminosas",
    "role": "protein",
    "proteinPer100g": 8.9,
    "kcalPer100g": 164,
    "carbsPer100g": 27,
    "fatPer100g": 2.6,
    "weightBasis": "cooked",
    "processing": "natural",
    "portions": [
      {
        "id": "grao-bico:chavena",
        "label": {
          "pt": "1 chávena (cozido)",
          "en": "1 cup (cooked)"
        },
        "grams": 160,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 3,
    "exampleRank": 45,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Com bacalhau e ovo"
      ],
      "en": [
        "With salt cod and egg"
      ]
    }
  },
  {
    "id": "grao-bico-lata",
    "name": {
      "pt": "Grão-de-bico em lata",
      "en": "Canned chickpeas"
    },
    "category": "leguminosas",
    "role": "protein",
    "proteinPer100g": 7.2,
    "kcalPer100g": 125,
    "carbsPer100g": 17,
    "fatPer100g": 2.5,
    "weightBasis": "as_sold",
    "processing": "processed",
    "portions": [
      {
        "id": "grao-bico-lata:meia-lata",
        "label": {
          "pt": "Meia lata (escorrida)",
          "en": "Half a can (drained)"
        },
        "grams": 120,
        "default": true
      },
      {
        "id": "grao-bico-lata:lata",
        "label": {
          "pt": "1 lata (escorrida)",
          "en": "1 can (drained)"
        },
        "grams": 240
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 1,
    "exampleRank": 60,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Salada com atum e cebola",
        "Húmus caseiro"
      ],
      "en": [
        "Salad with tuna and onion",
        "Homemade hummus"
      ]
    }
  },
  {
    "id": "lentilhas-castanhas",
    "name": {
      "pt": "Lentilhas castanhas",
      "en": "Brown lentils"
    },
    "category": "leguminosas",
    "role": "protein",
    "proteinPer100g": 9,
    "kcalPer100g": 116,
    "carbsPer100g": 20,
    "fatPer100g": 0.4,
    "weightBasis": "cooked",
    "processing": "natural",
    "portions": [
      {
        "id": "lentilhas-castanhas:chavena",
        "label": {
          "pt": "1 chávena (cozidas)",
          "en": "1 cup (cooked)"
        },
        "grams": 200,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 3,
    "exampleRank": 40,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Estufadas com legumes"
      ],
      "en": [
        "Stewed with vegetables"
      ]
    }
  },
  {
    "id": "lentilhas-vermelhas",
    "name": {
      "pt": "Lentilhas vermelhas",
      "en": "Red lentils"
    },
    "category": "leguminosas",
    "role": "protein",
    "proteinPer100g": 7.6,
    "kcalPer100g": 110,
    "carbsPer100g": 19,
    "fatPer100g": 0.4,
    "weightBasis": "cooked",
    "processing": "natural",
    "portions": [
      {
        "id": "lentilhas-vermelhas:chavena",
        "label": {
          "pt": "1 chávena (cozidas)",
          "en": "1 cup (cooked)"
        },
        "grams": 200,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 2,
    "exampleRank": 38,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Caril de lentilhas"
      ],
      "en": [
        "Lentil curry"
      ]
    }
  },
  {
    "id": "massa-lentilhas",
    "name": {
      "pt": "Massa de lentilhas",
      "en": "Lentil pasta"
    },
    "category": "leguminosas",
    "role": "protein",
    "proteinPer100g": 25,
    "kcalPer100g": 340,
    "carbsPer100g": 50,
    "fatPer100g": 2,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "massa-lentilhas:dose",
        "label": {
          "pt": "1 dose (crua)",
          "en": "1 serving (raw)"
        },
        "grams": 80,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 2,
    "exampleRank": 45,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Com tomate e manjericão"
      ],
      "en": [
        "With tomato and basil"
      ]
    }
  },
  {
    "id": "tremocos",
    "name": {
      "pt": "Tremoços",
      "en": "Lupin beans"
    },
    "category": "leguminosas",
    "role": "protein",
    "proteinPer100g": 15.6,
    "kcalPer100g": 119,
    "carbsPer100g": 9.9,
    "fatPer100g": 2.9,
    "weightBasis": "as_sold",
    "processing": "processed",
    "portions": [
      {
        "id": "tremocos:punhado",
        "label": {
          "pt": "1 punhado",
          "en": "1 handful"
        },
        "grams": 50,
        "default": true
      }
    ],
    "moments": [
      "meio-da-manha",
      "lanche"
    ],
    "ease": 1,
    "exampleRank": 50,
    "allergens": [
      "lupin"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Petisco de meio da tarde",
        "Em salada"
      ],
      "en": [
        "Afternoon snack",
        "In a salad"
      ]
    }
  },
  {
    "id": "arroz-branco",
    "name": {
      "pt": "Arroz branco",
      "en": "White rice"
    },
    "category": "cereais",
    "role": "carb",
    "proteinPer100g": 7,
    "kcalPer100g": 355,
    "carbsPer100g": 78,
    "fatPer100g": 0.6,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "arroz-branco:dose",
        "label": {
          "pt": "1 dose (cru)",
          "en": "1 serving (raw)"
        },
        "grams": 80,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 3,
    "exampleRank": 90,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Arroz de tomate",
        "Base para salteados"
      ],
      "en": [
        "Tomato rice",
        "Base for stir-fries"
      ]
    }
  },
  {
    "id": "arroz-integral",
    "name": {
      "pt": "Arroz integral",
      "en": "Brown rice"
    },
    "category": "cereais",
    "role": "carb",
    "proteinPer100g": 7.5,
    "kcalPer100g": 360,
    "carbsPer100g": 75,
    "fatPer100g": 2.7,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "arroz-integral:dose",
        "label": {
          "pt": "1 dose (cru)",
          "en": "1 serving (raw)"
        },
        "grams": 80,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 3,
    "exampleRank": 60,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "aveia-flocos",
    "name": {
      "pt": "Aveia em flocos",
      "en": "Rolled oats"
    },
    "category": "cereais",
    "role": "carb",
    "proteinPer100g": 13,
    "kcalPer100g": 370,
    "carbsPer100g": 60,
    "fatPer100g": 7,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "aveia-flocos:4-colheres",
        "label": {
          "pt": "4 colheres de sopa",
          "en": "4 tablespoons"
        },
        "grams": 40,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "lanche",
      "ceia"
    ],
    "ease": 1,
    "exampleRank": 85,
    "allergens": [
      "gluten"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Papas com leite e canela",
        "Com skyr e fruta"
      ],
      "en": [
        "Porridge with milk and cinnamon",
        "With skyr and fruit"
      ]
    }
  },
  {
    "id": "broa-milho",
    "name": {
      "pt": "Broa de milho",
      "en": "Corn bread (broa)"
    },
    "category": "cereais",
    "role": "carb",
    "proteinPer100g": 6,
    "kcalPer100g": 230,
    "carbsPer100g": 45,
    "fatPer100g": 2,
    "weightBasis": "as_sold",
    "processing": "processed",
    "portions": [
      {
        "id": "broa-milho:fatia",
        "label": {
          "pt": "1 fatia",
          "en": "1 slice"
        },
        "grams": 60,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "almoco",
      "lanche",
      "jantar"
    ],
    "ease": 1,
    "exampleRank": 40,
    "allergens": [
      "gluten"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "bulgur",
    "name": {
      "pt": "Bulgur",
      "en": "Bulgur"
    },
    "category": "cereais",
    "role": "carb",
    "proteinPer100g": 12,
    "kcalPer100g": 340,
    "carbsPer100g": 76,
    "fatPer100g": 1.3,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "bulgur:dose",
        "label": {
          "pt": "1 dose (cru)",
          "en": "1 serving (raw)"
        },
        "grams": 70,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 2,
    "exampleRank": 40,
    "allergens": [
      "gluten"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "cuscuz",
    "name": {
      "pt": "Cuscuz",
      "en": "Couscous"
    },
    "category": "cereais",
    "role": "carb",
    "proteinPer100g": 12.8,
    "kcalPer100g": 375,
    "carbsPer100g": 77,
    "fatPer100g": 0.6,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "cuscuz:dose",
        "label": {
          "pt": "1 dose (cru)",
          "en": "1 serving (raw)"
        },
        "grams": 70,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 2,
    "exampleRank": 55,
    "allergens": [
      "gluten"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Pronto em 5 minutos com água a ferver"
      ],
      "en": [
        "Ready in 5 minutes with boiling water"
      ]
    }
  },
  {
    "id": "massa-integral",
    "name": {
      "pt": "Massa integral",
      "en": "Wholewheat pasta"
    },
    "category": "cereais",
    "role": "carb",
    "proteinPer100g": 13,
    "kcalPer100g": 350,
    "carbsPer100g": 66,
    "fatPer100g": 2.5,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "massa-integral:dose",
        "label": {
          "pt": "1 dose (crua)",
          "en": "1 serving (raw)"
        },
        "grams": 80,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 2,
    "exampleRank": 60,
    "allergens": [
      "gluten"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "massa-trigo",
    "name": {
      "pt": "Massa de trigo",
      "en": "Wheat pasta"
    },
    "category": "cereais",
    "role": "carb",
    "proteinPer100g": 12,
    "kcalPer100g": 360,
    "carbsPer100g": 72,
    "fatPer100g": 1.5,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "massa-trigo:dose",
        "label": {
          "pt": "1 dose (crua)",
          "en": "1 serving (raw)"
        },
        "grams": 80,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 2,
    "exampleRank": 85,
    "allergens": [
      "gluten"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Com atum e tomate",
        "Com camarão e alho"
      ],
      "en": [
        "With tuna and tomato",
        "With prawns and garlic"
      ]
    }
  },
  {
    "id": "pao-centeio",
    "name": {
      "pt": "Pão de centeio",
      "en": "Rye bread"
    },
    "category": "cereais",
    "role": "carb",
    "proteinPer100g": 8.5,
    "kcalPer100g": 250,
    "carbsPer100g": 48,
    "fatPer100g": 1.7,
    "weightBasis": "as_sold",
    "processing": "processed",
    "portions": [
      {
        "id": "pao-centeio:2-fatias",
        "label": {
          "pt": "2 fatias",
          "en": "2 slices"
        },
        "grams": 60,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "lanche"
    ],
    "ease": 1,
    "exampleRank": 55,
    "allergens": [
      "gluten"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "pao-integral",
    "name": {
      "pt": "Pão integral",
      "en": "Wholemeal bread"
    },
    "category": "cereais",
    "role": "carb",
    "proteinPer100g": 9.5,
    "kcalPer100g": 240,
    "carbsPer100g": 42,
    "fatPer100g": 3,
    "weightBasis": "as_sold",
    "processing": "processed",
    "portions": [
      {
        "id": "pao-integral:2-fatias",
        "label": {
          "pt": "2 fatias",
          "en": "2 slices"
        },
        "grams": 60,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "lanche"
    ],
    "ease": 1,
    "exampleRank": 80,
    "allergens": [
      "gluten"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Tosta com ovo",
        "Sandes de queijo fresco"
      ],
      "en": [
        "Toast with egg",
        "Fresh cheese sandwich"
      ]
    }
  },
  {
    "id": "pao-mistura",
    "name": {
      "pt": "Pão de mistura",
      "en": "Mixed-grain bread"
    },
    "category": "cereais",
    "role": "carb",
    "proteinPer100g": 9,
    "kcalPer100g": 260,
    "carbsPer100g": 50,
    "fatPer100g": 1.5,
    "weightBasis": "as_sold",
    "processing": "processed",
    "portions": [
      {
        "id": "pao-mistura:pao",
        "label": {
          "pt": "1 pão",
          "en": "1 roll"
        },
        "grams": 70,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "lanche"
    ],
    "ease": 1,
    "exampleRank": 75,
    "allergens": [
      "gluten"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "quinoa",
    "name": {
      "pt": "Quinoa",
      "en": "Quinoa"
    },
    "category": "cereais",
    "role": "carb",
    "proteinPer100g": 14,
    "kcalPer100g": 370,
    "carbsPer100g": 64,
    "fatPer100g": 6,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "quinoa:dose",
        "label": {
          "pt": "1 dose (crua)",
          "en": "1 serving (raw)"
        },
        "grams": 70,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 2,
    "exampleRank": 55,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Salada com grão e legumes"
      ],
      "en": [
        "Salad with chickpeas and vegetables"
      ]
    }
  },
  {
    "id": "trigo-sarraceno",
    "name": {
      "pt": "Trigo-sarraceno",
      "en": "Buckwheat"
    },
    "category": "cereais",
    "role": "carb",
    "proteinPer100g": 13,
    "kcalPer100g": 345,
    "carbsPer100g": 72,
    "fatPer100g": 3.4,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "trigo-sarraceno:dose",
        "label": {
          "pt": "1 dose (cru)",
          "en": "1 serving (raw)"
        },
        "grams": 70,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 3,
    "exampleRank": 30,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "batata",
    "name": {
      "pt": "Batata",
      "en": "Potato"
    },
    "category": "tuberculos",
    "role": "carb",
    "proteinPer100g": 2,
    "kcalPer100g": 80,
    "carbsPer100g": 17,
    "fatPer100g": 0.1,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "batata:2-medias",
        "label": {
          "pt": "2 batatas médias",
          "en": "2 medium potatoes"
        },
        "grams": 250,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 3,
    "exampleRank": 70,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Cozida com bacalhau",
        "No forno com alecrim"
      ],
      "en": [
        "Boiled with salt cod",
        "Roasted with rosemary"
      ]
    }
  },
  {
    "id": "batata-doce",
    "name": {
      "pt": "Batata-doce",
      "en": "Sweet potato"
    },
    "category": "tuberculos",
    "role": "carb",
    "proteinPer100g": 1.6,
    "kcalPer100g": 90,
    "carbsPer100g": 20,
    "fatPer100g": 0.1,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "batata-doce:media",
        "label": {
          "pt": "1 batata-doce média",
          "en": "1 medium sweet potato"
        },
        "grams": 200,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 3,
    "exampleRank": 65,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Assada com salmão",
        "Em puré com canela"
      ],
      "en": [
        "Roasted with salmon",
        "Mashed with cinnamon"
      ]
    }
  },
  {
    "id": "mandioca",
    "name": {
      "pt": "Mandioca",
      "en": "Cassava"
    },
    "category": "tuberculos",
    "role": "carb",
    "proteinPer100g": 1.4,
    "kcalPer100g": 160,
    "carbsPer100g": 38,
    "fatPer100g": 0.3,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "mandioca:dose",
        "label": {
          "pt": "1 dose",
          "en": "1 serving"
        },
        "grams": 150,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 3,
    "exampleRank": 25,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "amendoa",
    "name": {
      "pt": "Amêndoa",
      "en": "Almonds"
    },
    "category": "frutos-secos",
    "role": "fat",
    "proteinPer100g": 21,
    "kcalPer100g": 590,
    "carbsPer100g": 7,
    "fatPer100g": 52,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "amendoa:punhado",
        "label": {
          "pt": "1 punhado",
          "en": "1 handful"
        },
        "grams": 30,
        "default": true
      }
    ],
    "moments": [
      "meio-da-manha",
      "lanche",
      "ceia"
    ],
    "ease": 1,
    "exampleRank": 40,
    "allergens": [
      "tree-nuts"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Com iogurte grego",
        "Petisco de bolso"
      ],
      "en": [
        "With Greek yogurt",
        "Pocket snack"
      ]
    }
  },
  {
    "id": "amendoim",
    "name": {
      "pt": "Amendoim torrado sem sal",
      "en": "Unsalted roasted peanuts"
    },
    "category": "frutos-secos",
    "role": "fat",
    "proteinPer100g": 26,
    "kcalPer100g": 590,
    "carbsPer100g": 10,
    "fatPer100g": 49,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "amendoim:punhado",
        "label": {
          "pt": "1 punhado",
          "en": "1 handful"
        },
        "grams": 30,
        "default": true
      }
    ],
    "moments": [
      "meio-da-manha",
      "lanche",
      "ceia"
    ],
    "ease": 1,
    "exampleRank": 42,
    "allergens": [
      "peanut"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "avela",
    "name": {
      "pt": "Avelã",
      "en": "Hazelnuts"
    },
    "category": "frutos-secos",
    "role": "fat",
    "proteinPer100g": 15,
    "kcalPer100g": 650,
    "carbsPer100g": 7,
    "fatPer100g": 61,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "avela:punhado",
        "label": {
          "pt": "1 punhado",
          "en": "1 handful"
        },
        "grams": 30,
        "default": true
      }
    ],
    "moments": [
      "meio-da-manha",
      "lanche",
      "ceia"
    ],
    "ease": 1,
    "exampleRank": 30,
    "allergens": [
      "tree-nuts"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "caju",
    "name": {
      "pt": "Caju",
      "en": "Cashews"
    },
    "category": "frutos-secos",
    "role": "fat",
    "proteinPer100g": 18,
    "kcalPer100g": 580,
    "carbsPer100g": 27,
    "fatPer100g": 46,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "caju:punhado",
        "label": {
          "pt": "1 punhado",
          "en": "1 handful"
        },
        "grams": 30,
        "default": true
      }
    ],
    "moments": [
      "meio-da-manha",
      "lanche",
      "ceia"
    ],
    "ease": 1,
    "exampleRank": 32,
    "allergens": [
      "tree-nuts"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "manteiga-amendoim",
    "name": {
      "pt": "Manteiga de amendoim 100%",
      "en": "100% peanut butter"
    },
    "category": "frutos-secos",
    "role": "fat",
    "proteinPer100g": 25,
    "kcalPer100g": 600,
    "carbsPer100g": 12,
    "fatPer100g": 50,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "manteiga-amendoim:colher",
        "label": {
          "pt": "1 colher de sopa",
          "en": "1 tablespoon"
        },
        "grams": 15,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "lanche"
    ],
    "ease": 1,
    "exampleRank": 35,
    "allergens": [
      "peanut"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Em tosta com banana",
        "Nas papas de aveia"
      ],
      "en": [
        "On toast with banana",
        "In porridge"
      ]
    }
  },
  {
    "id": "noz",
    "name": {
      "pt": "Noz",
      "en": "Walnuts"
    },
    "category": "frutos-secos",
    "role": "fat",
    "proteinPer100g": 15,
    "kcalPer100g": 690,
    "carbsPer100g": 3.3,
    "fatPer100g": 65,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "noz:punhado",
        "label": {
          "pt": "1 punhado",
          "en": "1 handful"
        },
        "grams": 30,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "lanche",
      "ceia"
    ],
    "ease": 1,
    "exampleRank": 38,
    "allergens": [
      "tree-nuts"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "pistacio",
    "name": {
      "pt": "Pistácio",
      "en": "Pistachios"
    },
    "category": "frutos-secos",
    "role": "fat",
    "proteinPer100g": 20,
    "kcalPer100g": 570,
    "carbsPer100g": 18,
    "fatPer100g": 46,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "pistacio:punhado",
        "label": {
          "pt": "1 punhado",
          "en": "1 handful"
        },
        "grams": 30,
        "default": true
      }
    ],
    "moments": [
      "meio-da-manha",
      "lanche",
      "ceia"
    ],
    "ease": 1,
    "exampleRank": 34,
    "allergens": [
      "tree-nuts"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "sementes-abobora",
    "name": {
      "pt": "Sementes de abóbora",
      "en": "Pumpkin seeds"
    },
    "category": "sementes",
    "role": "fat",
    "proteinPer100g": 30,
    "kcalPer100g": 560,
    "carbsPer100g": 5,
    "fatPer100g": 49,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "sementes-abobora:colher",
        "label": {
          "pt": "1 colher de sopa",
          "en": "1 tablespoon"
        },
        "grams": 10,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "almoco",
      "lanche",
      "jantar"
    ],
    "ease": 1,
    "exampleRank": 30,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "sementes-canhamo",
    "name": {
      "pt": "Sementes de cânhamo",
      "en": "Hemp seeds"
    },
    "category": "sementes",
    "role": "fat",
    "proteinPer100g": 32,
    "kcalPer100g": 570,
    "carbsPer100g": 3,
    "fatPer100g": 49,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "sementes-canhamo:colher",
        "label": {
          "pt": "1 colher de sopa",
          "en": "1 tablespoon"
        },
        "grams": 10,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "almoco",
      "lanche"
    ],
    "ease": 1,
    "exampleRank": 30,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "sementes-chia",
    "name": {
      "pt": "Sementes de chia",
      "en": "Chia seeds"
    },
    "category": "sementes",
    "role": "fat",
    "proteinPer100g": 17,
    "kcalPer100g": 490,
    "carbsPer100g": 8,
    "fatPer100g": 31,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "sementes-chia:colher",
        "label": {
          "pt": "1 colher de sopa",
          "en": "1 tablespoon"
        },
        "grams": 12,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "lanche",
      "ceia"
    ],
    "ease": 1,
    "exampleRank": 28,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "sementes-girassol",
    "name": {
      "pt": "Sementes de girassol",
      "en": "Sunflower seeds"
    },
    "category": "sementes",
    "role": "fat",
    "proteinPer100g": 21,
    "kcalPer100g": 580,
    "carbsPer100g": 11,
    "fatPer100g": 51,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "sementes-girassol:colher",
        "label": {
          "pt": "1 colher de sopa",
          "en": "1 tablespoon"
        },
        "grams": 10,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "almoco",
      "lanche",
      "jantar"
    ],
    "ease": 1,
    "exampleRank": 25,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "sementes-linhaca",
    "name": {
      "pt": "Sementes de linhaça",
      "en": "Flaxseeds"
    },
    "category": "sementes",
    "role": "fat",
    "proteinPer100g": 18,
    "kcalPer100g": 530,
    "carbsPer100g": 2,
    "fatPer100g": 42,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "sementes-linhaca:colher",
        "label": {
          "pt": "1 colher de sopa",
          "en": "1 tablespoon"
        },
        "grams": 10,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "lanche"
    ],
    "ease": 1,
    "exampleRank": 22,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "sesamo",
    "name": {
      "pt": "Sésamo",
      "en": "Sesame seeds"
    },
    "category": "sementes",
    "role": "fat",
    "proteinPer100g": 18,
    "kcalPer100g": 600,
    "carbsPer100g": 12,
    "fatPer100g": 50,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "sesamo:colher",
        "label": {
          "pt": "1 colher de sopa",
          "en": "1 tablespoon"
        },
        "grams": 10,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 1,
    "exampleRank": 15,
    "allergens": [
      "sesame"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "tahini",
    "name": {
      "pt": "Tahini",
      "en": "Tahini"
    },
    "category": "sementes",
    "role": "fat",
    "proteinPer100g": 17,
    "kcalPer100g": 600,
    "carbsPer100g": 10,
    "fatPer100g": 54,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "tahini:colher",
        "label": {
          "pt": "1 colher de sopa",
          "en": "1 tablespoon"
        },
        "grams": 15,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "lanche",
      "jantar"
    ],
    "ease": 1,
    "exampleRank": 20,
    "allergens": [
      "sesame"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "abacate",
    "name": {
      "pt": "Abacate",
      "en": "Avocado"
    },
    "category": "fruta",
    "role": "fat",
    "proteinPer100g": 2,
    "kcalPer100g": 160,
    "carbsPer100g": 2,
    "fatPer100g": 15,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "abacate:meio",
        "label": {
          "pt": "Meio abacate",
          "en": "Half an avocado"
        },
        "grams": 80,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "almoco",
      "lanche",
      "jantar"
    ],
    "ease": 1,
    "exampleRank": 35,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Em tosta com ovo"
      ],
      "en": [
        "On toast with egg"
      ]
    }
  },
  {
    "id": "ameixas",
    "name": {
      "pt": "Ameixas",
      "en": "Plums"
    },
    "category": "fruta",
    "role": "carb",
    "proteinPer100g": 0.7,
    "kcalPer100g": 46,
    "carbsPer100g": 10,
    "fatPer100g": 0.3,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "ameixas:2-ameixas",
        "label": {
          "pt": "2 ameixas",
          "en": "2 plums"
        },
        "grams": 130,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "lanche",
      "ceia"
    ],
    "ease": 1,
    "exampleRank": 30,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "ananas",
    "name": {
      "pt": "Ananás",
      "en": "Pineapple"
    },
    "category": "fruta",
    "role": "carb",
    "proteinPer100g": 0.5,
    "kcalPer100g": 50,
    "carbsPer100g": 12,
    "fatPer100g": 0.1,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "ananas:2-rodelas",
        "label": {
          "pt": "2 rodelas",
          "en": "2 slices"
        },
        "grams": 160,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "lanche",
      "ceia"
    ],
    "ease": 1,
    "exampleRank": 35,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "banana",
    "name": {
      "pt": "Banana",
      "en": "Banana"
    },
    "category": "fruta",
    "role": "carb",
    "proteinPer100g": 1.2,
    "kcalPer100g": 95,
    "carbsPer100g": 21,
    "fatPer100g": 0.2,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "banana:banana",
        "label": {
          "pt": "1 banana",
          "en": "1 banana"
        },
        "grams": 120,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "lanche"
    ],
    "ease": 1,
    "exampleRank": 75,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Com skyr",
        "Batido com leite"
      ],
      "en": [
        "With skyr",
        "Shake with milk"
      ]
    }
  },
  {
    "id": "cerejas",
    "name": {
      "pt": "Cerejas",
      "en": "Cherries"
    },
    "category": "fruta",
    "role": "carb",
    "proteinPer100g": 1.1,
    "kcalPer100g": 63,
    "carbsPer100g": 14,
    "fatPer100g": 0.2,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "cerejas:taca",
        "label": {
          "pt": "1 taça",
          "en": "1 bowl"
        },
        "grams": 150,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "lanche",
      "ceia"
    ],
    "ease": 1,
    "exampleRank": 30,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "figos",
    "name": {
      "pt": "Figos",
      "en": "Figs"
    },
    "category": "fruta",
    "role": "carb",
    "proteinPer100g": 0.8,
    "kcalPer100g": 74,
    "carbsPer100g": 16,
    "fatPer100g": 0.3,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "figos:2-figos",
        "label": {
          "pt": "2 figos",
          "en": "2 figs"
        },
        "grams": 100,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "lanche",
      "ceia"
    ],
    "ease": 1,
    "exampleRank": 30,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "framboesas",
    "name": {
      "pt": "Framboesas",
      "en": "Raspberries"
    },
    "category": "fruta",
    "role": "carb",
    "proteinPer100g": 1.2,
    "kcalPer100g": 52,
    "carbsPer100g": 6,
    "fatPer100g": 0.7,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "framboesas:taca",
        "label": {
          "pt": "1 taça",
          "en": "1 bowl"
        },
        "grams": 125,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "lanche",
      "ceia"
    ],
    "ease": 1,
    "exampleRank": 45,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "kiwi",
    "name": {
      "pt": "Kiwi",
      "en": "Kiwi"
    },
    "category": "fruta",
    "role": "carb",
    "proteinPer100g": 1.1,
    "kcalPer100g": 61,
    "carbsPer100g": 13,
    "fatPer100g": 0.5,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "kiwi:2-kiwis",
        "label": {
          "pt": "2 kiwis",
          "en": "2 kiwis"
        },
        "grams": 140,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "lanche",
      "ceia"
    ],
    "ease": 1,
    "exampleRank": 50,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "laranja",
    "name": {
      "pt": "Laranja",
      "en": "Orange"
    },
    "category": "fruta",
    "role": "carb",
    "proteinPer100g": 0.9,
    "kcalPer100g": 47,
    "carbsPer100g": 10,
    "fatPer100g": 0.1,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "laranja:laranja",
        "label": {
          "pt": "1 laranja",
          "en": "1 orange"
        },
        "grams": 150,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "lanche",
      "ceia"
    ],
    "ease": 1,
    "exampleRank": 55,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "maca",
    "name": {
      "pt": "Maçã",
      "en": "Apple"
    },
    "category": "fruta",
    "role": "carb",
    "proteinPer100g": 0.3,
    "kcalPer100g": 52,
    "carbsPer100g": 12,
    "fatPer100g": 0.2,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "maca:maca",
        "label": {
          "pt": "1 maçã",
          "en": "1 apple"
        },
        "grams": 150,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "lanche",
      "ceia"
    ],
    "ease": 1,
    "exampleRank": 70,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "manga",
    "name": {
      "pt": "Manga",
      "en": "Mango"
    },
    "category": "fruta",
    "role": "carb",
    "proteinPer100g": 0.8,
    "kcalPer100g": 60,
    "carbsPer100g": 14,
    "fatPer100g": 0.4,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "manga:meia",
        "label": {
          "pt": "Meia manga",
          "en": "Half a mango"
        },
        "grams": 150,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "lanche",
      "ceia"
    ],
    "ease": 1,
    "exampleRank": 40,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "melancia",
    "name": {
      "pt": "Melancia",
      "en": "Watermelon"
    },
    "category": "fruta",
    "role": "carb",
    "proteinPer100g": 0.6,
    "kcalPer100g": 30,
    "carbsPer100g": 7,
    "fatPer100g": 0.2,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "melancia:fatia",
        "label": {
          "pt": "1 fatia",
          "en": "1 slice"
        },
        "grams": 250,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "lanche",
      "ceia"
    ],
    "ease": 1,
    "exampleRank": 30,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "melao",
    "name": {
      "pt": "Melão",
      "en": "Melon"
    },
    "category": "fruta",
    "role": "carb",
    "proteinPer100g": 0.8,
    "kcalPer100g": 34,
    "carbsPer100g": 8,
    "fatPer100g": 0.2,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "melao:fatia",
        "label": {
          "pt": "1 fatia",
          "en": "1 slice"
        },
        "grams": 200,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "lanche",
      "ceia"
    ],
    "ease": 1,
    "exampleRank": 35,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "mirtilos",
    "name": {
      "pt": "Mirtilos",
      "en": "Blueberries"
    },
    "category": "fruta",
    "role": "carb",
    "proteinPer100g": 0.7,
    "kcalPer100g": 57,
    "carbsPer100g": 13,
    "fatPer100g": 0.3,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "mirtilos:taca",
        "label": {
          "pt": "1 taça",
          "en": "1 bowl"
        },
        "grams": 125,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "lanche",
      "ceia"
    ],
    "ease": 1,
    "exampleRank": 55,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "morangos",
    "name": {
      "pt": "Morangos",
      "en": "Strawberries"
    },
    "category": "fruta",
    "role": "carb",
    "proteinPer100g": 0.7,
    "kcalPer100g": 32,
    "carbsPer100g": 7,
    "fatPer100g": 0.3,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "morangos:taca",
        "label": {
          "pt": "1 taça",
          "en": "1 bowl"
        },
        "grams": 150,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "lanche",
      "ceia"
    ],
    "ease": 1,
    "exampleRank": 60,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "pera",
    "name": {
      "pt": "Pera",
      "en": "Pear"
    },
    "category": "fruta",
    "role": "carb",
    "proteinPer100g": 0.4,
    "kcalPer100g": 57,
    "carbsPer100g": 13,
    "fatPer100g": 0.1,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "pera:pera",
        "label": {
          "pt": "1 pera",
          "en": "1 pear"
        },
        "grams": 150,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "lanche",
      "ceia"
    ],
    "ease": 1,
    "exampleRank": 60,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "pessego",
    "name": {
      "pt": "Pêssego",
      "en": "Peach"
    },
    "category": "fruta",
    "role": "carb",
    "proteinPer100g": 0.9,
    "kcalPer100g": 39,
    "carbsPer100g": 9,
    "fatPer100g": 0.3,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "pessego:pessego",
        "label": {
          "pt": "1 pêssego",
          "en": "1 peach"
        },
        "grams": 150,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "lanche",
      "ceia"
    ],
    "ease": 1,
    "exampleRank": 40,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "roma",
    "name": {
      "pt": "Romã",
      "en": "Pomegranate"
    },
    "category": "fruta",
    "role": "carb",
    "proteinPer100g": 1.7,
    "kcalPer100g": 83,
    "carbsPer100g": 14,
    "fatPer100g": 1.2,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "roma:meia",
        "label": {
          "pt": "Meia romã",
          "en": "Half a pomegranate"
        },
        "grams": 100,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "lanche",
      "ceia"
    ],
    "ease": 1,
    "exampleRank": 20,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "tamaras",
    "name": {
      "pt": "Tâmaras",
      "en": "Dates"
    },
    "category": "fruta",
    "role": "carb",
    "proteinPer100g": 1.8,
    "kcalPer100g": 280,
    "carbsPer100g": 66,
    "fatPer100g": 0.4,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "tamaras:3-tamaras",
        "label": {
          "pt": "3 tâmaras",
          "en": "3 dates"
        },
        "grams": 30,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "lanche",
      "ceia"
    ],
    "ease": 1,
    "exampleRank": 25,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "tangerina",
    "name": {
      "pt": "Tangerina",
      "en": "Tangerine"
    },
    "category": "fruta",
    "role": "carb",
    "proteinPer100g": 0.8,
    "kcalPer100g": 53,
    "carbsPer100g": 12,
    "fatPer100g": 0.3,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "tangerina:2-tangerinas",
        "label": {
          "pt": "2 tangerinas",
          "en": "2 tangerines"
        },
        "grams": 140,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "lanche",
      "ceia"
    ],
    "ease": 1,
    "exampleRank": 50,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "uvas",
    "name": {
      "pt": "Uvas",
      "en": "Grapes"
    },
    "category": "fruta",
    "role": "carb",
    "proteinPer100g": 0.7,
    "kcalPer100g": 69,
    "carbsPer100g": 17,
    "fatPer100g": 0.2,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "uvas:cacho",
        "label": {
          "pt": "1 cacho pequeno",
          "en": "1 small bunch"
        },
        "grams": 120,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "meio-da-manha",
      "lanche",
      "ceia"
    ],
    "ease": 1,
    "exampleRank": 40,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "abobora",
    "name": {
      "pt": "Abóbora",
      "en": "Pumpkin"
    },
    "category": "legumes",
    "role": "vegetable",
    "proteinPer100g": 1,
    "kcalPer100g": 26,
    "carbsPer100g": 5,
    "fatPer100g": 0.1,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "abobora:fatia",
        "label": {
          "pt": "1 fatia",
          "en": "1 slice"
        },
        "grams": 150,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 3,
    "exampleRank": 30,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "alface",
    "name": {
      "pt": "Alface",
      "en": "Lettuce"
    },
    "category": "legumes",
    "role": "vegetable",
    "proteinPer100g": 1.4,
    "kcalPer100g": 15,
    "carbsPer100g": 2,
    "fatPer100g": 0.2,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "alface:taca",
        "label": {
          "pt": "1 taça",
          "en": "1 bowl"
        },
        "grams": 50,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 1,
    "exampleRank": 50,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "beringela",
    "name": {
      "pt": "Beringela",
      "en": "Aubergine"
    },
    "category": "legumes",
    "role": "vegetable",
    "proteinPer100g": 1,
    "kcalPer100g": 25,
    "carbsPer100g": 3,
    "fatPer100g": 0.2,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "beringela:meia",
        "label": {
          "pt": "Meia beringela",
          "en": "Half an aubergine"
        },
        "grams": 150,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 3,
    "exampleRank": 25,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "beterraba",
    "name": {
      "pt": "Beterraba",
      "en": "Beetroot"
    },
    "category": "legumes",
    "role": "vegetable",
    "proteinPer100g": 1.6,
    "kcalPer100g": 43,
    "carbsPer100g": 8,
    "fatPer100g": 0.2,
    "weightBasis": "cooked",
    "processing": "natural",
    "portions": [
      {
        "id": "beterraba:beterraba",
        "label": {
          "pt": "1 beterraba",
          "en": "1 beetroot"
        },
        "grams": 100,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 1,
    "exampleRank": 25,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "brocolos",
    "name": {
      "pt": "Brócolos",
      "en": "Broccoli"
    },
    "category": "legumes",
    "role": "vegetable",
    "proteinPer100g": 3,
    "kcalPer100g": 34,
    "carbsPer100g": 4,
    "fatPer100g": 0.4,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "brocolos:chavena",
        "label": {
          "pt": "1 chávena",
          "en": "1 cup"
        },
        "grams": 100,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 2,
    "exampleRank": 60,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Ao vapor em 5 minutos",
        "Salteados com alho"
      ],
      "en": [
        "Steamed in 5 minutes",
        "Sautéed with garlic"
      ]
    }
  },
  {
    "id": "cebola",
    "name": {
      "pt": "Cebola",
      "en": "Onion"
    },
    "category": "legumes",
    "role": "vegetable",
    "proteinPer100g": 1.1,
    "kcalPer100g": 40,
    "carbsPer100g": 8,
    "fatPer100g": 0.1,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "cebola:meia",
        "label": {
          "pt": "Meia cebola",
          "en": "Half an onion"
        },
        "grams": 60,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 2,
    "exampleRank": 25,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "cenoura",
    "name": {
      "pt": "Cenoura",
      "en": "Carrot"
    },
    "category": "legumes",
    "role": "vegetable",
    "proteinPer100g": 0.9,
    "kcalPer100g": 41,
    "carbsPer100g": 7.5,
    "fatPer100g": 0.2,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "cenoura:cenoura",
        "label": {
          "pt": "1 cenoura",
          "en": "1 carrot"
        },
        "grams": 80,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "lanche",
      "jantar"
    ],
    "ease": 1,
    "exampleRank": 45,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "cogumelos",
    "name": {
      "pt": "Cogumelos",
      "en": "Mushrooms"
    },
    "category": "legumes",
    "role": "vegetable",
    "proteinPer100g": 3.1,
    "kcalPer100g": 22,
    "carbsPer100g": 0.5,
    "fatPer100g": 0.3,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "cogumelos:chavena",
        "label": {
          "pt": "1 chávena",
          "en": "1 cup"
        },
        "grams": 90,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 2,
    "exampleRank": 40,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "courgette",
    "name": {
      "pt": "Courgette",
      "en": "Courgette"
    },
    "category": "legumes",
    "role": "vegetable",
    "proteinPer100g": 1.2,
    "kcalPer100g": 17,
    "carbsPer100g": 2.5,
    "fatPer100g": 0.3,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "courgette:meia",
        "label": {
          "pt": "Meia courgette",
          "en": "Half a courgette"
        },
        "grams": 150,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 2,
    "exampleRank": 40,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "couve-bruxelas",
    "name": {
      "pt": "Couve-de-bruxelas",
      "en": "Brussels sprouts"
    },
    "category": "legumes",
    "role": "vegetable",
    "proteinPer100g": 3.4,
    "kcalPer100g": 43,
    "carbsPer100g": 5,
    "fatPer100g": 0.3,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "couve-bruxelas:chavena",
        "label": {
          "pt": "1 chávena",
          "en": "1 cup"
        },
        "grams": 90,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 3,
    "exampleRank": 30,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "couve-flor",
    "name": {
      "pt": "Couve-flor",
      "en": "Cauliflower"
    },
    "category": "legumes",
    "role": "vegetable",
    "proteinPer100g": 1.9,
    "kcalPer100g": 25,
    "carbsPer100g": 3,
    "fatPer100g": 0.3,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "couve-flor:chavena",
        "label": {
          "pt": "1 chávena",
          "en": "1 cup"
        },
        "grams": 100,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 2,
    "exampleRank": 45,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "couve-kale",
    "name": {
      "pt": "Couve kale",
      "en": "Kale"
    },
    "category": "legumes",
    "role": "vegetable",
    "proteinPer100g": 4.3,
    "kcalPer100g": 49,
    "carbsPer100g": 5,
    "fatPer100g": 0.9,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "couve-kale:punhado",
        "label": {
          "pt": "1 punhado",
          "en": "1 handful"
        },
        "grams": 50,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 2,
    "exampleRank": 30,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "couve-portuguesa",
    "name": {
      "pt": "Couve-portuguesa",
      "en": "Portuguese cabbage"
    },
    "category": "legumes",
    "role": "vegetable",
    "proteinPer100g": 3,
    "kcalPer100g": 33,
    "carbsPer100g": 4,
    "fatPer100g": 0.6,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "couve-portuguesa:dose",
        "label": {
          "pt": "1 dose",
          "en": "1 serving"
        },
        "grams": 100,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 3,
    "exampleRank": 30,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "espargos",
    "name": {
      "pt": "Espargos",
      "en": "Asparagus"
    },
    "category": "legumes",
    "role": "vegetable",
    "proteinPer100g": 2.2,
    "kcalPer100g": 20,
    "carbsPer100g": 2,
    "fatPer100g": 0.1,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "espargos:6-espargos",
        "label": {
          "pt": "6 espargos",
          "en": "6 spears"
        },
        "grams": 100,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 2,
    "exampleRank": 30,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "espinafres",
    "name": {
      "pt": "Espinafres",
      "en": "Spinach"
    },
    "category": "legumes",
    "role": "vegetable",
    "proteinPer100g": 2.9,
    "kcalPer100g": 23,
    "carbsPer100g": 1.4,
    "fatPer100g": 0.4,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "espinafres:punhado",
        "label": {
          "pt": "1 punhado grande",
          "en": "1 large handful"
        },
        "grams": 60,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 2,
    "exampleRank": 50,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Salteados com ovo",
        "Crus em salada"
      ],
      "en": [
        "Sautéed with egg",
        "Raw in a salad"
      ]
    }
  },
  {
    "id": "feijao-verde",
    "name": {
      "pt": "Feijão-verde",
      "en": "Green beans"
    },
    "category": "legumes",
    "role": "vegetable",
    "proteinPer100g": 1.8,
    "kcalPer100g": 31,
    "carbsPer100g": 4,
    "fatPer100g": 0.2,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "feijao-verde:chavena",
        "label": {
          "pt": "1 chávena",
          "en": "1 cup"
        },
        "grams": 120,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 2,
    "exampleRank": 40,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "pepino",
    "name": {
      "pt": "Pepino",
      "en": "Cucumber"
    },
    "category": "legumes",
    "role": "vegetable",
    "proteinPer100g": 0.7,
    "kcalPer100g": 15,
    "carbsPer100g": 3,
    "fatPer100g": 0.1,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "pepino:meio",
        "label": {
          "pt": "Meio pepino",
          "en": "Half a cucumber"
        },
        "grams": 150,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 1,
    "exampleRank": 40,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "pimento",
    "name": {
      "pt": "Pimento",
      "en": "Bell pepper"
    },
    "category": "legumes",
    "role": "vegetable",
    "proteinPer100g": 0.9,
    "kcalPer100g": 26,
    "carbsPer100g": 5,
    "fatPer100g": 0.3,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "pimento:meio",
        "label": {
          "pt": "Meio pimento",
          "en": "Half a pepper"
        },
        "grams": 80,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 2,
    "exampleRank": 35,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "rucula",
    "name": {
      "pt": "Rúcula",
      "en": "Rocket"
    },
    "category": "legumes",
    "role": "vegetable",
    "proteinPer100g": 2.6,
    "kcalPer100g": 25,
    "carbsPer100g": 2,
    "fatPer100g": 0.7,
    "weightBasis": "raw",
    "processing": "natural",
    "portions": [
      {
        "id": "rucula:punhado",
        "label": {
          "pt": "1 punhado",
          "en": "1 handful"
        },
        "grams": 30,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 1,
    "exampleRank": 40,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "tomate",
    "name": {
      "pt": "Tomate",
      "en": "Tomato"
    },
    "category": "legumes",
    "role": "vegetable",
    "proteinPer100g": 0.9,
    "kcalPer100g": 20,
    "carbsPer100g": 3.5,
    "fatPer100g": 0.2,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "tomate:tomate",
        "label": {
          "pt": "1 tomate",
          "en": "1 tomato"
        },
        "grams": 120,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 1,
    "exampleRank": 55,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [
        "Salada com orégãos",
        "Em tosta com azeite"
      ],
      "en": [
        "Salad with oregano",
        "On toast with olive oil"
      ]
    }
  },
  {
    "id": "alho",
    "name": {
      "pt": "Alho",
      "en": "Garlic"
    },
    "category": "despensa",
    "role": "pantry",
    "proteinPer100g": 6,
    "kcalPer100g": 140,
    "carbsPer100g": 28,
    "fatPer100g": 0.3,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "alho:2-dentes",
        "label": {
          "pt": "2 dentes",
          "en": "2 cloves"
        },
        "grams": 8,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 1,
    "exampleRank": 0,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "azeite",
    "name": {
      "pt": "Azeite",
      "en": "Olive oil"
    },
    "category": "despensa",
    "role": "pantry",
    "proteinPer100g": 0,
    "kcalPer100g": 900,
    "carbsPer100g": 0,
    "fatPer100g": 100,
    "weightBasis": "as_sold",
    "processing": "culinary",
    "portions": [
      {
        "id": "azeite:colher",
        "label": {
          "pt": "1 colher de sopa",
          "en": "1 tablespoon"
        },
        "grams": 10,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 1,
    "exampleRank": 0,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "cacau",
    "name": {
      "pt": "Cacau em pó 100%",
      "en": "100% cocoa powder"
    },
    "category": "despensa",
    "role": "pantry",
    "proteinPer100g": 20,
    "kcalPer100g": 230,
    "carbsPer100g": 58,
    "fatPer100g": 14,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "cacau:colher",
        "label": {
          "pt": "1 colher de sopa",
          "en": "1 tablespoon"
        },
        "grams": 5,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "lanche",
      "ceia"
    ],
    "ease": 1,
    "exampleRank": 0,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "canela",
    "name": {
      "pt": "Canela",
      "en": "Cinnamon"
    },
    "category": "despensa",
    "role": "pantry",
    "proteinPer100g": 4,
    "kcalPer100g": 247,
    "carbsPer100g": 81,
    "fatPer100g": 1.2,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "canela:colher",
        "label": {
          "pt": "1 colher de chá",
          "en": "1 teaspoon"
        },
        "grams": 2,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "lanche",
      "ceia",
      "almoco",
      "jantar"
    ],
    "ease": 1,
    "exampleRank": 0,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "caril",
    "name": {
      "pt": "Caril em pó",
      "en": "Curry powder"
    },
    "category": "despensa",
    "role": "pantry",
    "proteinPer100g": 14,
    "kcalPer100g": 325,
    "carbsPer100g": 56,
    "fatPer100g": 14,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "caril:colher",
        "label": {
          "pt": "1 colher de chá",
          "en": "1 teaspoon"
        },
        "grams": 2,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 1,
    "exampleRank": 0,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "coentros",
    "name": {
      "pt": "Coentros",
      "en": "Coriander"
    },
    "category": "despensa",
    "role": "pantry",
    "proteinPer100g": 2.1,
    "kcalPer100g": 23,
    "carbsPer100g": 4,
    "fatPer100g": 0.5,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "coentros:punhado",
        "label": {
          "pt": "1 punhado",
          "en": "1 handful"
        },
        "grams": 10,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 1,
    "exampleRank": 0,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "colorau",
    "name": {
      "pt": "Colorau",
      "en": "Paprika"
    },
    "category": "despensa",
    "role": "pantry",
    "proteinPer100g": 14,
    "kcalPer100g": 280,
    "carbsPer100g": 54,
    "fatPer100g": 13,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "colorau:colher",
        "label": {
          "pt": "1 colher de chá",
          "en": "1 teaspoon"
        },
        "grams": 2,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 1,
    "exampleRank": 0,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "cominhos",
    "name": {
      "pt": "Cominhos",
      "en": "Cumin"
    },
    "category": "despensa",
    "role": "pantry",
    "proteinPer100g": 18,
    "kcalPer100g": 375,
    "carbsPer100g": 44,
    "fatPer100g": 22,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "cominhos:colher",
        "label": {
          "pt": "1 colher de chá",
          "en": "1 teaspoon"
        },
        "grams": 2,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 1,
    "exampleRank": 0,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "gengibre",
    "name": {
      "pt": "Gengibre",
      "en": "Ginger"
    },
    "category": "despensa",
    "role": "pantry",
    "proteinPer100g": 1.8,
    "kcalPer100g": 80,
    "carbsPer100g": 18,
    "fatPer100g": 0.8,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "gengibre:pedaco",
        "label": {
          "pt": "1 pedaço",
          "en": "1 piece"
        },
        "grams": 10,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 1,
    "exampleRank": 0,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "leite-coco",
    "name": {
      "pt": "Leite de coco",
      "en": "Coconut milk"
    },
    "category": "despensa",
    "role": "pantry",
    "proteinPer100g": 2,
    "kcalPer100g": 200,
    "carbsPer100g": 3,
    "fatPer100g": 20,
    "weightBasis": "as_sold",
    "processing": "processed",
    "portions": [
      {
        "id": "leite-coco:quarto-lata",
        "label": {
          "pt": "Um quarto de lata",
          "en": "A quarter of a can"
        },
        "grams": 100,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 1,
    "exampleRank": 0,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "limao",
    "name": {
      "pt": "Limão",
      "en": "Lemon"
    },
    "category": "despensa",
    "role": "pantry",
    "proteinPer100g": 1,
    "kcalPer100g": 30,
    "carbsPer100g": 6,
    "fatPer100g": 0.3,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "limao:meio",
        "label": {
          "pt": "Meio limão",
          "en": "Half a lemon"
        },
        "grams": 40,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "almoco",
      "lanche",
      "jantar"
    ],
    "ease": 1,
    "exampleRank": 0,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "manjericao",
    "name": {
      "pt": "Manjericão",
      "en": "Basil"
    },
    "category": "despensa",
    "role": "pantry",
    "proteinPer100g": 3.2,
    "kcalPer100g": 23,
    "carbsPer100g": 2.7,
    "fatPer100g": 0.6,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "manjericao:punhado",
        "label": {
          "pt": "1 punhado",
          "en": "1 handful"
        },
        "grams": 10,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 1,
    "exampleRank": 0,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "manteiga",
    "name": {
      "pt": "Manteiga",
      "en": "Butter"
    },
    "category": "despensa",
    "role": "pantry",
    "proteinPer100g": 0.6,
    "kcalPer100g": 740,
    "carbsPer100g": 0.6,
    "fatPer100g": 82,
    "weightBasis": "as_sold",
    "processing": "culinary",
    "portions": [
      {
        "id": "manteiga:colher",
        "label": {
          "pt": "1 colher de chá",
          "en": "1 teaspoon"
        },
        "grams": 5,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "almoco",
      "jantar"
    ],
    "ease": 1,
    "exampleRank": 0,
    "allergens": [
      "milk"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "mel",
    "name": {
      "pt": "Mel",
      "en": "Honey"
    },
    "category": "despensa",
    "role": "pantry",
    "proteinPer100g": 0.3,
    "kcalPer100g": 320,
    "carbsPer100g": 80,
    "fatPer100g": 0,
    "weightBasis": "as_sold",
    "processing": "culinary",
    "portions": [
      {
        "id": "mel:colher",
        "label": {
          "pt": "1 colher de chá",
          "en": "1 teaspoon"
        },
        "grams": 7,
        "default": true
      }
    ],
    "moments": [
      "pequeno-almoco",
      "lanche",
      "ceia",
      "almoco",
      "jantar"
    ],
    "ease": 1,
    "exampleRank": 0,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "mostarda",
    "name": {
      "pt": "Mostarda",
      "en": "Mustard"
    },
    "category": "despensa",
    "role": "pantry",
    "proteinPer100g": 4.4,
    "kcalPer100g": 100,
    "carbsPer100g": 6,
    "fatPer100g": 6,
    "weightBasis": "as_sold",
    "processing": "processed",
    "portions": [
      {
        "id": "mostarda:colher",
        "label": {
          "pt": "1 colher de chá",
          "en": "1 teaspoon"
        },
        "grams": 5,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 1,
    "exampleRank": 0,
    "allergens": [
      "mustard"
    ],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "oregaos",
    "name": {
      "pt": "Orégãos",
      "en": "Oregano"
    },
    "category": "despensa",
    "role": "pantry",
    "proteinPer100g": 9,
    "kcalPer100g": 265,
    "carbsPer100g": 69,
    "fatPer100g": 4,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "oregaos:colher",
        "label": {
          "pt": "1 colher de chá",
          "en": "1 teaspoon"
        },
        "grams": 1,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 1,
    "exampleRank": 0,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "pimenta-preta",
    "name": {
      "pt": "Pimenta preta",
      "en": "Black pepper"
    },
    "category": "despensa",
    "role": "pantry",
    "proteinPer100g": 10,
    "kcalPer100g": 250,
    "carbsPer100g": 64,
    "fatPer100g": 3,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "pimenta-preta:pitada",
        "label": {
          "pt": "1 pitada",
          "en": "1 pinch"
        },
        "grams": 1,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 1,
    "exampleRank": 0,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "polpa-tomate",
    "name": {
      "pt": "Polpa de tomate",
      "en": "Tomato passata"
    },
    "category": "despensa",
    "role": "pantry",
    "proteinPer100g": 1.6,
    "kcalPer100g": 30,
    "carbsPer100g": 5,
    "fatPer100g": 0.2,
    "weightBasis": "as_sold",
    "processing": "processed",
    "portions": [
      {
        "id": "polpa-tomate:3-colheres",
        "label": {
          "pt": "3 colheres de sopa",
          "en": "3 tablespoons"
        },
        "grams": 50,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 1,
    "exampleRank": 0,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "sal",
    "name": {
      "pt": "Sal",
      "en": "Salt"
    },
    "category": "despensa",
    "role": "pantry",
    "proteinPer100g": 0,
    "kcalPer100g": 0,
    "carbsPer100g": 0,
    "fatPer100g": 0,
    "weightBasis": "as_sold",
    "processing": "culinary",
    "portions": [
      {
        "id": "sal:pitada",
        "label": {
          "pt": "1 pitada",
          "en": "1 pinch"
        },
        "grams": 1,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 1,
    "exampleRank": 0,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "salsa",
    "name": {
      "pt": "Salsa",
      "en": "Parsley"
    },
    "category": "despensa",
    "role": "pantry",
    "proteinPer100g": 3,
    "kcalPer100g": 36,
    "carbsPer100g": 6,
    "fatPer100g": 0.8,
    "weightBasis": "as_sold",
    "processing": "natural",
    "portions": [
      {
        "id": "salsa:punhado",
        "label": {
          "pt": "1 punhado",
          "en": "1 handful"
        },
        "grams": 10,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 1,
    "exampleRank": 0,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  },
  {
    "id": "vinagre",
    "name": {
      "pt": "Vinagre",
      "en": "Vinegar"
    },
    "category": "despensa",
    "role": "pantry",
    "proteinPer100g": 0,
    "kcalPer100g": 20,
    "carbsPer100g": 0.6,
    "fatPer100g": 0,
    "weightBasis": "as_sold",
    "processing": "culinary",
    "portions": [
      {
        "id": "vinagre:colher",
        "label": {
          "pt": "1 colher de sopa",
          "en": "1 tablespoon"
        },
        "grams": 15,
        "default": true
      }
    ],
    "moments": [
      "almoco",
      "jantar"
    ],
    "ease": 1,
    "exampleRank": 0,
    "allergens": [],
    "tcaCode": "REF",
    "ideas": {
      "pt": [],
      "en": []
    }
  }
];
