using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using SolidCharacters.Domain.JsonModels;
using Newtonsoft.Json;
using SolidCharacters.Domain;
using SolidCharacters.Domain.DTO.Updated;
using SolidCharacters.Domain.SRDSpells;
using Microsoft.Extensions.Logging;

namespace SolidCharacters.Repository.Services
{
    
    public class DbJsonService : IDbJsonService
    {
        private DBCollection DatabaseCollection = new DBCollection();
        private readonly string path;
        public string JsonRoot => path;

        public DbJsonService(Microsoft.Extensions.Logging.ILogger<DbJsonService>? logger = null)
        {
            // Step 1: Resolve base path (separate from loading db.json)
            path = ResolveDataRoot(logger);
            logger?.LogInformation("DbJsonService initialized. BasePath={Base} DataExists={Exists}", path, Directory.Exists(Path.Combine(path, "data")));

            // Step 2: Try to load db.json but don't change path or crash if missing
            try
            {
                DatabaseCollection = GetDB();
            }
            catch (Exception ex)
            {
                logger?.LogWarning(ex, "DbJsonService: Failed to load db.json from {Path}. Using empty DatabaseCollection.", path);
                DatabaseCollection = new DBCollection();
            }
        }

        /// <summary>
        /// Resolves the base path containing the data/ folder.
        /// Validates DB_JSON_ROOT if set; otherwise walks up from AppContext.BaseDirectory.
        /// </summary>
        private static string ResolveDataRoot(ILogger? logger)
        {
            // Check environment variable first, but only accept if it actually contains data/
            var envRoot = Environment.GetEnvironmentVariable("DB_JSON_ROOT");
            if (!string.IsNullOrWhiteSpace(envRoot))
            {
                if (Directory.Exists(Path.Combine(envRoot, "data")))
                {
                    return envRoot;
                }
                logger?.LogWarning("DB_JSON_ROOT={EnvRoot} does not contain a 'data' folder. Ignoring.", envRoot);
            }

            // Walk up from SafeBaseDirectory to find repo root with data/ folder
            var baseAttempt = SafeBaseDirectory();
            var candidate = baseAttempt;
            for (int i = 0; i < 6; i++)
            {
                if (Directory.Exists(Path.Combine(candidate, "data")))
                {
                    return candidate;
                }
                var parent = Directory.GetParent(candidate)?.FullName;
                if (parent == null) break;
                candidate = parent;
            }

            // Fallback: return baseAttempt even if no data/ folder found (graceful degradation)
            logger?.LogWarning("Could not locate 'data' folder within 6 parents of {BaseAttempt}. SRD JSON loading will fail.", baseAttempt);
            return baseAttempt;
        }
        // ------- DatabaseCollection && DB JSON Interactions ---------
        /// <summary>
        /// Gets a Json File.
        /// </summary>
        /// <typeparam name="T">The Type that matches the json structure.</typeparam>
        /// <param name="name">the filename.</param>
        /// <returns></returns>
        public T? GetJson<T>(string name){
            using (StreamReader r = new StreamReader($"{path}/data/{name}.json"))
            {
                string json = r.ReadToEnd();
                var item = JsonConvert.DeserializeObject<T>(json);
                return item;
            }
        }

        public List<The5ESrdClassesJson> GetThe5EClasses()
        {
					using (StreamReader r = new StreamReader($"{path}/data/classes.json"))
					{
						string json = r.ReadToEnd();
						var the5ESrdClassesJson = The5ESrdClassesJson.FromJson(json);
						return the5ESrdClassesJson;
					}
        }
        public void SaveJson(string name, object value, bool append = false){
            using (StreamWriter r = new StreamWriter($"{path}/data/{name}.json", append))
            {
                if (append)
                {
                    r.WriteLine(JsonConvert.SerializeObject(value));
                } else {
                    r.Write(JsonConvert.SerializeObject(value));
                }
            }
        }

        public DBCollection GetDB() {
            var item = GetJson<DBCollection>("db");
            if (item == null)
            {
                return new DBCollection();
            } else
            {
                return item;
            }
        }
        private static string SafeBaseDirectory()
        {
            try
            {
                // AppContext.BaseDirectory is stable for published apps
                var baseDir = AppContext.BaseDirectory;
                if (!string.IsNullOrWhiteSpace(baseDir)) return baseDir.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
            }
            catch { }
            try
            {
                var current = Directory.GetCurrentDirectory();
                if (!string.IsNullOrWhiteSpace(current)) return current;
            }
            catch { }
            // Last resort: assembly location
            try
            {
                var asm = Assembly.GetExecutingAssembly();
                var location = asm.Location;
                if (!string.IsNullOrWhiteSpace(location)) return Path.GetDirectoryName(location) ?? ".";
            }
            catch { }
            return ".";
        }
        public void SyncDatabaseJSON(){
            SaveJson("db",DatabaseCollection);
        }

        // --------- DatabaseCollection Interactions ----------
        public int GetCollectionIndex(string collectionName){
            int index = -1;
            var collection = DatabaseCollection.collections.Find((collection)=>{
                    if (collection.Name == collectionName)
                    {
                        index = DatabaseCollection.collections.IndexOf(collection);
                    }
                    return collection.Name == collectionName;
                });
            return index;
        }
        public DBCollectionModel? GetCollectionFromDB(string collectionName) {
            int index = 0;
            var collection = DatabaseCollection.collections.Find((collection)=>{
                    index = DatabaseCollection.collections.IndexOf(collection);
                    return collection.Name == collectionName;
                });
            return collection;
        } 
        public void ReplaceCollectionAllData(string collectionName, string[] data){
            var index = GetCollectionIndex(collectionName);
            if (index > -1)
            {
                DatabaseCollection.collections[index].Data = data;
            }
                SyncDatabaseJSON();
        }
        public void AddToDataCollection(string collectionName, string data) {
            var collectionIndex = GetCollectionIndex(collectionName);
            if (data != null && collectionIndex > -1)
            {
                DatabaseCollection?.collections[collectionIndex]?.Data?.Append(data ?? "");
            }
                SyncDatabaseJSON();
        }
        public void CreateCollectionInDB(string collectionName, string[] data) {
            var alreadyExists = DatabaseCollection.collections.Find((value)=>value.Name==collectionName);
            if (alreadyExists == null)
            {
                DatabaseCollection.collections.Add(new DBCollectionModel(){Name=collectionName,Data=data});
                SyncDatabaseJSON();
            }
        }
    }
    public interface IDbJsonService {
        List<The5ESrdClassesJson> GetThe5EClasses();
        T? GetJson<T>(string name);
        void SaveJson(string name, object value, bool append = false);
        DBCollection GetDB();
        void SyncDatabaseJSON();
        int GetCollectionIndex(string collectionName);
        DBCollectionModel? GetCollectionFromDB(string collectionName);
        void ReplaceCollectionAllData(string collectionName, string[] data);
        void AddToDataCollection(string collectionName, string data);
        void CreateCollectionInDB(string collectionName, string[] data);
    }
}