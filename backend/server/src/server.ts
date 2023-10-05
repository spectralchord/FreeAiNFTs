import express from 'express';
import morgan from "morgan";
import cors from 'cors';
import 'dotenv/config'
import routes from './routes';

const PORT = process.env.PORT || 5000

const app = express()

app.use(cors())
app.use(express.json())
app.use(morgan('dev'))
app.use(express.urlencoded({extended: true}))
app.use('/api', routes)

app.listen(PORT, () => {
    console.log(`Server port: ${PORT}`);
})
