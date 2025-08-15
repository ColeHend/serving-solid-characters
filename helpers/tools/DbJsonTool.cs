using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using DndClassJson;
using Newtonsoft.Json;
using sharpAngleTemplate.models;
using SRDSpellsjson;

namespace sharpAngleTemplate.tools
{
    
    public class DbJsonService : IDbJsonService
    {
        private DBCollection DatabaseCollection = new DBCollection();
        private readonly string path;
        public string JsonRoot => path;

        public DbJsonService(Microsoft.Extensions.Logging.ILogger<DbJsonService>? logger = null)
        {
            try
            {
                // Allow override via environment variable DB_JSON_ROOT
                var baseAttempt = Environment.GetEnvironmentVariable("DB_JSON_ROOT")
                                   ?? SafeBaseDirectory();
                var candidate = baseAttempt;
                if (!Directory.Exists(Path.Combine(candidate, "data")))
                {
                    // Try parent if not found
                    var parent = Directory.GetParent(candidate)?.FullName;
                    if (parent != null && Directory.Exists(Path.Combine(parent, "data")))
                    {
                        candidate = parent;
                    }
                }
                path = candidate;
                logger?.LogInformation("DbJsonService initialized. BasePath={Base} DataExists={Exists}", path, Directory.Exists(Path.Combine(path, "data")));
                DatabaseCollection = GetDB();
            }
            catch (Exception ex)
            {
                path = AppContext.BaseDirectory;
                logger?.LogError(ex, "DbJsonService failed during initialization. Falling back to {Path}", path);
                // Keep DatabaseCollection empty rather than throw to avoid crashing every request
            }
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