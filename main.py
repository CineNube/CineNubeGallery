from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

movies = [
    {
        "title": "Euphoria",
        "rating": 8.3,
        "image": "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg"
    },
    {
        "title": "Mentes Criminales",
        "rating": 8.3,
        "image": "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg"
    },
    {
        "title": "Rancho Dutton",
        "rating": 9.4,
        "image": "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg"
    }
]

@app.get("/movies")
def get_movies():
    data = []

    for k, v in VIDEOS.items():
        data.append({
            "title": v.get("titulo", "Sin título"),
            "rating": v.get("rating", 8),
            "image": v.get("imagen", "https://via.placeholder.com/300x450")
        })

    return data