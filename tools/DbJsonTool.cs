using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using DndClassJson;
using Newtonsoft.Json;
using sharpAngleTemplate.models;
using sharpAngleTemplate.Repositories;
using SRDSpellsjson;

namespace sharpAngleTemplate.tools
{

    public class DbJsonService : IDbJsonService
    {
        private DBCollection DatabaseCollection;
        private string path = GetExecutingDirectory().ToString();
        public DbJsonService()
        {
            DatabaseCollection = GetDB();
        }
        // ------- DatabaseCollection && DB JSON Interactions ---------
        /// <summary>
        /// Gets a Json File.
        /// </summary>
        /// <typeparam name="T">The Type that matches the json structure.</typeparam>
        /// <param name="name">the filename.</param>
        /// <returns></returns>
        public T? GetJson<T>(string name)
        {
            string filePath = $"{path}/data/{name}.json";

            if (!File.Exists(filePath))
            {
                $"File not found: {filePath}".LogError();
                return default;
            }

            try
            {
                using (StreamReader r = new StreamReader(filePath))
                {
                    string json = r.ReadToEnd();
                    var item = JsonConvert.DeserializeObject<T>(json);
                    return item;
                }
            }
            catch (IOException ex)
            {
                $"Error reading file {filePath}: {ex.Message}".LogError();
                return default;
            }
            catch (JsonException ex)
            {
                $"Error deserializing JSON from {filePath}: {ex.Message}".LogError();
                return default;
            }
            catch (Exception ex)
            {
                $"Unexpected error: {ex.Message}".LogError();
                return default;
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
        public void SaveJson(string name, object value, bool append = false)
        {
            using (StreamWriter r = new StreamWriter($"{path}/data/{name}.json", append))
            {
                if (append)
                {
                    r.WriteLine(JsonConvert.SerializeObject(value));
                }
                else
                {
                    r.Write(JsonConvert.SerializeObject(value));
                }
            }
        }

        public DBCollection GetDB()
        {
            var item = GetJson<DBCollection>("db");
            if (item == null)
            {
                return new DBCollection();
            }
            else
            {
                return item;
            }
        }
        public static DirectoryInfo GetExecutingDirectory()
        {
            var location = new Uri(Assembly.GetEntryAssembly().GetName().CodeBase);
            return new FileInfo(location.AbsolutePath).Directory.Parent.Parent.Parent;
        }
        public void SyncDatabaseJSON()
        {
            SaveJson("db", DatabaseCollection);
        }

        // --------- DatabaseCollection Interactions ----------
        public int GetCollectionIndex(string collectionName)
        {
            int index = -1;
            var collection = DatabaseCollection.collections.Find((collection) =>
            {
                if (collection.Name == collectionName)
                {
                    index = DatabaseCollection.collections.IndexOf(collection);
                }
                return collection.Name == collectionName;
            });
            return index;
        }
        public DBCollectionModel? GetCollectionFromDB(string collectionName)
        {
            int index = 0;
            var collection = DatabaseCollection.collections.Find((collection) =>
            {
                index = DatabaseCollection.collections.IndexOf(collection);
                return collection.Name == collectionName;
            });
            return collection;
        }
        public void ReplaceCollectionAllData(string collectionName, string[] data)
        {
            var index = GetCollectionIndex(collectionName);
            if (index > -1)
            {
                DatabaseCollection.collections[index].Data = data;
            }
            SyncDatabaseJSON();
        }
        public void AddToDataCollection(string collectionName, string data)
        {
            var collectionIndex = GetCollectionIndex(collectionName);
            if (data != null && collectionIndex > -1)
            {
                DatabaseCollection?.collections[collectionIndex]?.Data?.Append(data ?? "");
            }
            SyncDatabaseJSON();
        }
        public void CreateCollectionInDB(string collectionName, string[] data)
        {
            var alreadyExists = DatabaseCollection.collections.Find((value) => value.Name == collectionName);
            if (alreadyExists == null)
            {
                DatabaseCollection.collections.Add(new DBCollectionModel() { Name = collectionName, Data = data });
                SyncDatabaseJSON();
            }
        }
    }
    public interface IDbJsonService
    {
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