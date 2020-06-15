// IMPORTAR
const MongoClient = require('mongodb').MongoClient;
const xml2js = require('xml2js');
const fetch = require('node-fetch')


// SETEO
let parser = new xml2js.Parser();


// FUNCIONES

//------------------------------------------------------------------
/**
 * 
 * @param {String} uri : URI de la Base de Datos
 * @param {String} password : Password de la Base de Datos
 * 
 * @return {String} db_uri_complete : URI completa
 */
function db_uri_complete (uri, password) {
    const patron_pass = '<password>';
    return uri.replace(patron_pass, password)
}

//------------------------------------------------------------------

/**
 * 
 * @param {Number} hrs : cantidad de tiempo en horas
 * @param {Number} min : cantidad de tiempo en minutos
 * @param {Number} sec : cantidad de tiempo en segundos
 * 
 * @return {Number} miliseconds : Tiempo en milisegundos
 */
function miliseconds (hrs,min,sec) {
    return((hrs*60*60+min*60+sec)*1000);
}

//------------------------------------------------------------------

/**
 * 
 * @param {Number} uri : direccion URI para la conexion a la base de datos
 * 
 * @return {Array} documentos : Array de documentos que ocntiene las direcciones de consultas de las fuentes
 */
function fuentes (uri) {
	return new Promise ( (res, rej) => {
		const client = new MongoClient(uri, { useNewUrlParser: true });
		client.connect(function (err, client) {
			if (err) {
				rej(err)
				client.close()
				process.exit(1)
		   }

			const db = client.db('news_sources');
			const collection = db.collection('sources');
			collection.find().toArray( (err, data) => {
				const documentos = [...data]
				res(documentos);
			})

			client.close();
		})
	}
	);
}

//------------------------------------------------------------------

/**
 * 
 * @param {XML} data : 
 * 
 * @return {OBJ JS} dataJS : Objetos JS
 */
function xml2JS (data) {
    return new Promise( async (res, rej) => {
        let dataJS = await parser.parseStringPromise(data);
        res(dataJS);
    });
}


//------------------------------------------------------------------

/**
 * 
 * @param {Array} array_raw : Array de Arrays
 * 
 * @return {Array} array_spread : Dispersa en un solo Array
 */
function spread (array_raw) {
	let array_spread = [];
	
	array_raw.forEach( (item) => {
		array_spread = [...array_spread, ...item]
	});
	
	return array_spread;
}

//------------------------------------------------------------------

/**
 * Recibe el objeto que contiene las fuentes de consultas de noticias
 * @param {OBJ JS} noticia_fuente : Objecto de noticia  con estructura cruda.
 * 
 * @return {OBJ JS} retorno : 
 */
function noticias_raw (noticia_fuente) {
	return new Promise ( async (res, rej) => {
		try{
			let data_xml = await fetch(noticia_fuente.sources_type.lo_ultimo);
			let dataText = await data_xml.text();
			let data_js = await xml2JS(dataText);

			let retorno = data_js.rss.channel[0].item;
			return retorno;
		}catch(err){
			// --> dev
		}
	});
}

//------------------------------------------------------------------

/**
 * Recibe el objeto que contiene las fuentes de consultas de noticias
 * @param {}  : 
 * 
 * @return {}  : 
 */
function news_js (noticias_fuentes) {
	return new Promise ( async (res, rej) => {
		try{
			let news = [];
		
			news = await noticias_fuentes.map( async (noticia_fuente) => {
				let data_xml = await fetch(noticia_fuente.sources_type.lo_ultimo);
				let dataText = await data_xml.text();
				let data_js = await xml2JS(dataText);

				let retorno = await data_js.rss.channel[0].item;
				return retorno;
			});

			res(news)
		}catch(e){
			// -->
		}
	});
}

//------------------------------------------------------------------

/**
 * Recibe el objeto que contiene las fuentes de consultas de noticias
 * @param {}  : 
 * 
 * @return {}  : 
 */
function news_standard (news) {
	let news_return = news.map( (news_item, index, fuentes) => {
		// Verificar el estado de las noticias si son 'undefined'

		// Definicion del Standard
		let standard = {
			fuente : news_item.link[0].split(".")[1] ,
			titulo : news_item.title[0],
			// descripcion : news_item.description, --> Verificar, algunos retornan undefined
			link : news_item.link[0],
			fecha : news_item.pubDate[0],
		}
		return (standard);
	});
	
	return news_return;
}

//------------------------------------------------------------------

/**
 * Recibe el objeto que contiene las fuentes de consultas de noticias
 * @param {}  : 
 * 
 * @return {}  : 
 */
function news_save(news, uri) {
	
	return new Promise( (res, rej) => {
		// Conexion a DB
		const client = new MongoClient(uri, { useNewUrlParser: true });
		client.connect(function (err, client) {
			if (err) {
				rej(err);
				client.close();
				process.exit(1);
			}
			
			const db = client.db('news_sources');
			const collection = db.collection('news');
			
			news.forEach( (noticia, index) => {
				collection.findOne({ titulo : noticia.titulo})
					.then( (doc) => {
						if(doc == null){
							collection.insertOne(noticia);
							console.log('guardando: ', index);
						}else {
							// console.log('Noticia repetida...', index);
						}
					})
					.catch( (err) => {
						console.log(err);
					});
			})
		});
	});	
}

//------------------------------------------------------------------
// EXPORTAR
module.exports = {
	db_uri_complete,
	miliseconds,
	fuentes,
	spread,
	noticias_raw,
	news_js,
	news_standard,
	news_save,
}