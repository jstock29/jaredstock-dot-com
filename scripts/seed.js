import { db } from "../src/firebase.js";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";

const projects = [
  { title: "social data", text: "I led the development of an open source app and open data for a variety of social datasets in the US.", image: "https://jareds-file-sharing.s3.amazonaws.com/social-data.png", link: "https://share.streamlit.io/arup-group/social-data/run.py", github: "https://github.com/arup-group/social-data", order: 1 },
  { title: "deal or no deal", text: "I watched over 100 episodes of Deal or No Deal to conduct this analysis of the greatest game show of all time.", image: "https://jareds-file-sharing.s3.amazonaws.com/dond-interface.png", link: "https://share.streamlit.io/jstock29/dealnodeal/main/app.py", github: "https://github.com/jstock29/dealnodeal", order: 2 },
  { title: "processing playground", text: "A little AI-made tool to view, edit, and export p5.js animations.", image: "https://jareds-file-sharing.s3.us-east-1.amazonaws.com/processing-playground.jpeg", link: "https://processing-playground.web.app", github: "https://github.com/jstock29/processing-playground", order: 3 },
  { title: "teetum.com", text: "I made a website for my friend's birthday as joke. You won't get the jokes.", image: "https://jareds-file-sharing.s3.amazonaws.com/teetum.png", link: "https://teetum.com/", github: "https://github.com/jstock29/teetum-dot-com", order: 4 },
  { title: "bigballsannie.com", text: "I made yet another joke website for my friend's birthday, only even weirder somehow.", image: "https://jareds-file-sharing.s3.amazonaws.com/bba.png", link: "https://bigballsannie.com/", github: "https://github.com/jstock29/bigballsannie-dot-com", order: 5 },
];

const publications = [
  { title: "i figured out how deal or no deal works (kind of)", text: "Towards Data Science", image: "https://jareds-file-sharing.s3.amazonaws.com/tds.png", link: "https://towardsdatascience.com/i-figured-out-how-deal-or-no-deal-works-kind-of-875e63a8cef6", order: 1 },
  { title: "an open source approach to preventing evictions", text: "Arup Digital News | Medium", image: "https://jareds-file-sharing.s3.amazonaws.com/arup-digital.png", link: "https://medium.com/arup-digital-news/an-open-source-approach-to-preventing-evictions-5ed4ad5daea6", order: 2 },
];

const skills = [
  { label: "Python", color: "primary", type: "languages" },
  { label: "Pandas", color: "secondary", type: "frameworks_tools" },
  { label: "Streamlit", color: "secondary", type: "frameworks_tools" },
  { label: "Data Analysis", color: "default", type: "skills" },
  { label: "Data Science", color: "default", type: "skills" },
  { label: "Machine Learning", color: "default", type: "skills" },
  { label: "Genetic Algorithms", color: "default", type: "skills" },
  { label: "Javascript", color: "primary", type: "languages" },
  { label: "Typescript", color: "primary", type: "languages" },
  { label: "HTML", color: "primary", type: "languages" },
  { label: "CSS", color: "primary", type: "languages" },
  { label: "Sass", color: "primary", type: "languages" },
  { label: "Angular", color: "secondary", type: "frameworks_tools" },
  { label: "NGRX", color: "secondary", type: "frameworks_tools" },
  { label: "React", color: "secondary", type: "frameworks_tools" },
  { label: "Node.js", color: "secondary", type: "frameworks_tools" },
  { label: "SQL", color: "primary", type: "languages" },
  { label: "PostgreSQL", color: "secondary", type: "frameworks_tools" },
  { label: "Devops", color: "default", type: "skills" },
  { label: "Git", color: "secondary", type: "frameworks_tools" },
  { label: "Docker", color: "secondary", type: "frameworks_tools" },
  { label: "Serverless", color: "secondary", type: "frameworks_tools" },
  { label: "JSON", color: "secondary", type: "frameworks_tools" },
  { label: "Amazon Web Services", color: "secondary", type: "frameworks_tools" },
  { label: "Google Cloud Platform", color: "secondary", type: "frameworks_tools" },
  { label: "Websockets", color: "default", type: "skills" },
  { label: "Parallel Programming", color: "default", type: "skills" },
  { label: "Linux", color: "default", type: "skills" },
  { label: "Agile", color: "default", type: "skills" },
  { label: "Solution Architecture", color: "default", type: "skills" },
  { label: "Responsive Design", color: "default", type: "skills" },
  { label: "Bash", color: "primary", type: "languages" },
  { label: "MongoDB", color: "secondary", type: "frameworks_tools" },
  { label: "Terraform", color: "secondary", type: "frameworks_tools" },
  { label: "Kubernetes", color: "secondary", type: "frameworks_tools" },
  { label: "Cloud Architecture", color: "default", type: "skills" },
  { label: "Unit Testing", color: "default", type: "skills" },
];

async function clearCollection(colName) {
  const snapshot = await getDocs(collection(db, colName));
  for (const docSnapshot of snapshot.docs) {
    await deleteDoc(doc(db, colName, docSnapshot.id));
  }
  console.log(`Cleared ${colName}`);
}

async function seed() {
  try {
    await clearCollection("projects");
    await clearCollection("publications");
    await clearCollection("skills");

    for (const p of projects) await addDoc(collection(db, "projects"), p);
    for (const p of publications) await addDoc(collection(db, "publications"), p);
    for (const s of skills) await addDoc(collection(db, "skills"), s);
    console.log("Seeding complete");
  } catch (e) {
    console.error("Error seeding: ", e);
  }
}

seed();
