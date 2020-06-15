// IMPORTAR
require('dotenv').config();
const {db_uri_complete, miliseconds, fuentes, spread, noticias_raw, news_js, news_standard, news_save} = require('./controllers/controller');

// SETEOS
const DB_URI = db_uri_complete(process.env.DB_URI, process.env.DB_PASSWORD );
const TIME_QUERY_HOUR = parseInt( process.env.COLLECTOR_TIME_QUERY_NEWS_HOUR );
const TIME_QUERY_MIN  = parseInt( process.env.COLLECTOR_TIME_QUERY_NEWS_MIN );
const TIME_QUERY_SEG  = parseInt( process.env.COLLECTOR_TIME_QUERY_NEWS_SEG );
console.log('URI de la DB: ', DB_URI);

//-----------------------------------------------------------------
// PROGRAM

// Variables
let news_fuentes;
const TIME_QUERY_MILLS = miliseconds(TIME_QUERY_HOUR, TIME_QUERY_MIN, TIME_QUERY_SEG);
console.log('Tiempo en Milisegundos de Consultas del Colector: ', TIME_QUERY_MILLS);


( async () => {
	
		// Pedido de las fuentes de noticias a la DB
		let noticias_fuentes = [];
		noticias_fuentes = await fuentes(DB_URI);
		console.log('Fuentes: ', noticias_fuentes);
		
		console.log('----------------------------------------------------------');
		console.log('Iniciando el Colector de Noticias...', Date());
		console.log('----------------------------------------------------------');

		// Recoleccion y Guardado en DB de Noticias en forma Periodica
		setInterval(
			async () => {
				try {
					// Buscando Noticias
					console.log('------------------------------------');
					console.log('Buscando Noticias...', Date());
					console.log('------------------------------------');

					// Fetch de Array de Noticias Crudas
					let notis_response = await news_js(noticias_fuentes);
					let notis_raw = await Promise.all(notis_response);
					let notis = spread(notis_raw);
					let news = await news_standard(notis);

					// Verificacion y Guardado de Noticias en el DB
					await news_save(news, DB_URI);
				}catch (err) {
					console.log('error del programa principal', '\n', err);
				}
			}
			,TIME_QUERY_MILLS
		);
	
}) ();
