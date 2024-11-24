CREATE TABLE books (
id SERIAL PRIMARY KEY,
isbn BIGINT,
title VARCHAR(75),
subtitle VARCHAR(75),
author VARCHAR(50),
pages INT,
publisher VARCHAR(50),
publish_date INT,
cover_url VARCHAR(75),
date_read date,
rating INT,
notes_intro TEXT
);

CREATE TABLE notes (
id SERIAL PRIMARY KEY,
book_id INT REFERENCES books(id),
note_date DATE,
note TEXT
);

