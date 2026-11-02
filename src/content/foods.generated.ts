// Gerado por scripts/content-build.ts a partir de content/foods. Não editar.
import type { Food } from "@/domain/food";

export const FOOD_DATA_VERSION = 1;

export const FOOD_SOURCE = "TCA, INSA (Tabela da Composição de Alimentos)";

export const FOODS: readonly Food[] = [
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
    "tcaCode": "TODO",
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
    "tcaCode": "TODO",
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
    "tcaCode": "TODO",
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
    "tcaCode": "TODO",
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
    "tcaCode": "TODO",
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
    "tcaCode": "TODO",
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
    "tcaCode": "TODO",
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
    "tcaCode": "TODO",
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
    "tcaCode": "TODO",
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
    "tcaCode": "TODO",
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
    "tcaCode": "TODO",
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
    "tcaCode": "TODO",
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
    "tcaCode": "TODO",
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
    "tcaCode": "TODO",
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
    "tcaCode": "TODO",
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
    "tcaCode": "TODO",
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
    "tcaCode": "TODO",
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
    "tcaCode": "TODO",
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
    "tcaCode": "TODO",
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
    "tcaCode": "TODO",
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
    "tcaCode": "TODO",
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
    "tcaCode": "TODO",
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
    "tcaCode": "TODO",
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
    "tcaCode": "TODO",
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
    "tcaCode": "TODO",
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
    "tcaCode": "TODO",
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
    "tcaCode": "TODO",
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
    "tcaCode": "TODO",
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
    "tcaCode": "TODO",
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
    "tcaCode": "TODO",
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
    "tcaCode": "TODO",
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
    "tcaCode": "TODO",
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
    "tcaCode": "TODO",
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
    "tcaCode": "TODO",
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
    "tcaCode": "TODO",
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
    "tcaCode": "TODO",
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
    "tcaCode": "TODO",
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
    "tcaCode": "TODO",
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
    "tcaCode": "TODO",
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
    "tcaCode": "TODO",
    "ideas": {
      "pt": [],
      "en": []
    }
  }
];
