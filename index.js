import express from "express";
import ejs from "ejs";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";

const app = express();
const port = 3000;

// Setup the database connection
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "booknotes",
  password: "enterDBpassword",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(bodyParser.json());

// GET route to show the homepage and list read books in the database
app.get("/", async (req, res) => {
  try {
  const books = await db.query(`SELECT b.id, b.isbn, b.title, b.subtitle, b.author, b.pages, b.publisher, b.publish_date, b.cover_url, TO_CHAR(b.date_read, 'mm/dd/yyyy') AS date_read, b.rating, b.notes_intro FROM books b ORDER BY b.date_read ASC`);
  
  res.render('index.ejs', { books: books.rows });

  } catch (err) { console.log(err) }  
});

// GET route to get book informatioin when an ISBN is searched on openlibrary.org
app.get("/new", async (req, res) => {
  const searchIsbn = parseInt(req.query.isbn);
  try {
    const result = await axios.get(`http://openlibrary.org/api/volumes/brief/isbn/${searchIsbn}.json`);
    const bookInfo = Object.values(result.data.records)[0];
    const isbn = bookInfo.data.identifiers.isbn_13[0];
    console.log(isbn);
    const title = bookInfo.data.title;
    const subtitle = bookInfo.data.subtitle;
    const author = bookInfo.data.authors[0].name;
    const pages = bookInfo.data.number_of_pages;
    const publisher = bookInfo.data.publishers[0].name;
    const publish_date = bookInfo.data.publish_date;
    const cover = bookInfo.data.cover.medium;

    res.render("new.ejs", { author: author, title: title, pages: pages,  publisher: publisher, publish_date: publish_date, cover: cover, isbn: isbn });
  } catch (err) { console.log(err) }
});

// POST route to save new book data to the database
app.post("/save", async (req, res) => {
  console.log(req.body);
  try {
    const isbn = req.body.isbn;
    const title = req.body.title;
    const author = req.body.author;
    const publisher = req.body.publisher;
    const publish_date = req.body.publish_date;
    const pages = req.body.pages;
    const cover = req.body.cover;
    const date_read = req.body.date_read;
    const description = req.body.description;
    const rating = req.body.rating;
    const note = req.body.note;
    const note_date = req.body.note_date;

    const result = await db.query("INSERT INTO books (isbn, title, author, pages, publisher, publish_date, cover_url, date_read, rating, notes_intro) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id",
      [isbn, title, author, pages, publisher, publish_date, cover, date_read, rating, description]);
      
    const id = result.rows[0].id;

    await db.query("INSERT INTO notes (note_date, note, book_id) VALUES ($1, $2, $3)", [note_date, note, id]);

    res.redirect("/");

} catch (err) {
  console.log(err);
}
});

// GET route to show notes and ask for new notes for individual books
app.get("/notes/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const book = await db.query(`SELECT b.id, b.isbn, b.title, b.subtitle, b.author, b.pages, b.publisher, b.publish_date, b.cover_url, TO_CHAR(b.date_read, 'mm/dd/yyyy') AS date_read, b.rating, b.notes_intro FROM books b WHERE b.id = ($1)`, [id]);
    const notes = await db.query(`SELECT note, TO_CHAR(note_date, 'mm/dd/yyyy') AS note_date FROM notes WHERE book_id = ($1)`, [id]);

    res.render("notes.ejs", { book: book.rows[0], notes: notes.rows });

  } catch (err) { console.log(err) }
  });

  // POST route to update the database with new notes
  app.post("/notes/:id", async (req, res) => {
    console.log(req.body);
    try {
    const id = parseInt(req.params.id);
    const note = req.body.note;
    const note_date = req.body.note_date;

    await db.query("INSERT INTO notes (note_date, note, book_id) VALUES ($1, $2, $3)", [note_date, note, id]);
    
    res.redirect(`/notes/${id}`);

    } catch (err) {
      console.log(err);
    }
  });

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


/*let books = [
  {
    id: 1,
    isbn: 9780452262935,
    title: "1984",
    subtitle: null,
    author: "George Orwell",
    pages: 320,
    publisher: "Penguin Publishing Group",
    publish_date: "04/01/1983",
    cover_url: "https://covers.openlibrary.org/b/isbn/9780452262935-M.jpg",
    date_read: "12/01/2010",
    rating: 10,
    notes_intro: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Nulla explicabo, fugiat possimus modi inventore quod magnam consequuntur eum, dicta excepturi id ullam deserunt officiis error delectus ex eius tempora natus! Modi aut deserunt repellendus ullam, nihil, explicabo dignissimos doloribus aliquam error commodi quos! Praesentium voluptas, quae libero cumque expedita quidem, tempora debitis rem iste nesciunt quasi, enim fugit possimus! Adipisci. Quod ut alias quia consequatur! Corporis quaerat dolorum quas et quae a, incidunt reiciendis recusandae quasi odit accusantium aliquam maiores eius quo numquam suscipit voluptatum aliquid placeat expedita id amet.",
    notes: "Great Book",
  },
  {
    id: 2,
    isbn: 9780804190114,
    title: "On Tyranny",
    subtitle: "Twenty Lessons from the Twentieth Century",
    author: "Timothy Snider",
    pages: 128,
    publisher: "Crown Publishing Group",
    publish_date: "02/28/2017",
    cover_url: "https://covers.openlibrary.org/b/isbn/9780804190114-M.jpg",
    date_read: "11/24/2019",
    rating: 5,
    notes_intro: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquid itaque atque esse quae non rem tenetur, commodi autem, aut saepe, officia a eveniet vel adipisci cupiditate iusto quibusdam temporibus ab?Lorem ipsum dolor sit amet consectetur adipisicing elit. Porro incidunt repudiandae at exercitationem sequi, rerum tempore iusto vitae explicabo maxime laudantium, sunt ipsa ullam inventore excepturi. Amet quis dolorum dignissimos?",
    notes: "Probably written hastily after Donald Trump was elected.",
  },
]; */