from math import radians, sin, cos, sqrt, atan2
from sqlalchemy.orm import Session

from ..models import Hospital, Ambulance, AmbulanceStatus


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return R * 2 * atan2(sqrt(a), sqrt(1 - a))


def recommend_hospitals(
    lat: float, lon: float, severity: str, db: Session, top_n: int = 3
) -> list[dict]:
    hospitals = (
        db.query(Hospital)
        .filter(Hospital.status == "active", Hospital.available_beds > 0)
        .all()
    )

    scored = []
    for h in hospitals:
        dist = haversine(lat, lon, h.latitude, h.longitude)
        bed_ratio = h.available_beds / max(h.total_beds, 1)
        icu_bonus = 0.3 if h.available_icu > 0 else 0
        dist_penalty = min(dist / 50, 1.0)

        if severity in ("critical", "high"):
            severity_weight = 0.6
            icu_weight = 0.2
            dist_weight = 0.2
        else:
            severity_weight = 0.4
            icu_weight = 0.1
            dist_weight = 0.5

        score = (bed_ratio * severity_weight) + (icu_bonus * icu_weight) - (dist_penalty * dist_weight)

        scored.append({
            "id": h.id,
            "name": h.name,
            "latitude": h.latitude,
            "longitude": h.longitude,
            "distance_km": round(dist, 2),
            "available_beds": h.available_beds,
            "available_icu": h.available_icu,
            "score": round(score, 3),
        })

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:top_n]


def recommend_ambulances(
    lat: float, lon: float, db: Session, top_n: int = 3
) -> list[dict]:
    ambulances = (
        db.query(Ambulance)
        .filter(Ambulance.status == AmbulanceStatus.AVAILABLE)
        .all()
    )

    scored = []
    for a in ambulances:
        dist = haversine(lat, lon, a.latitude, a.longitude)
        scored.append({
            "id": a.id,
            "vehicle_id": a.vehicle_id,
            "latitude": a.latitude,
            "longitude": a.longitude,
            "distance_km": round(dist, 2),
        })

    scored.sort(key=lambda x: x["distance_km"])
    return scored[:top_n]


def estimate_response_time(
    e_lat: float, e_lon: float, ambulance_id: int | None, db: Session
) -> float | None:
    if not ambulance_id:
        return None
    ambulance = db.query(Ambulance).filter(Ambulance.id == ambulance_id).first()
    if not ambulance:
        return None
    dist = haversine(e_lat, e_lon, ambulance.latitude, ambulance.longitude)
    avg_speed = 40
    return round(dist / avg_speed * 60, 1)


def predict_hotspots(emergencies: list, n_clusters: int = 3) -> list[dict]:
    if len(emergencies) < 3:
        return []

    coords = [(e.latitude, e.longitude) for e in emergencies]

    from sklearn.cluster import KMeans
    import numpy as np

    X = np.array(coords)
    k = min(n_clusters, len(coords))
    kmeans = KMeans(n_clusters=k, random_state=42, n_init="auto")
    labels = kmeans.fit_predict(X)

    hotspots = []
    for i in range(k):
        mask = labels == i
        cluster_points = X[mask]
        hotspots.append({
            "latitude": round(float(cluster_points.mean(axis=0)[0]), 4),
            "longitude": round(float(cluster_points.mean(axis=0)[1]), 4),
            "frequency": int(mask.sum()),
        })

    hotspots.sort(key=lambda x: x["frequency"], reverse=True)
    return hotspots
