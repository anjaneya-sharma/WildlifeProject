CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS images (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    filepath VARCHAR(255) NOT NULL,
    user_id INTEGER REFERENCES users(id),
    model_type INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS boxes (
    id SERIAL PRIMARY KEY,
    image_id INTEGER REFERENCES images(id),
    class_id INTEGER REFERENCES classes(id),
    x FLOAT NOT NULL,
    y FLOAT NOT NULL,
    width FLOAT NOT NULL,
    height FLOAT NOT NULL,
    confidence FLOAT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS annotations (
    id SERIAL PRIMARY KEY,
    image_id INTEGER REFERENCES images(id),
    width FLOAT NOT NULL,
    height FLOAT NOT NULL,
    cluster_centers JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);