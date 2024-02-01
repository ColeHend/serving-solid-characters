using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace sharpAngleTemplate.models
{
    public class DBCollection {
        public List<DBCollectionModel> collections {get;set;} = new List<DBCollectionModel>();
    }
    public class DBCollectionModel
    {
        public string Name {get; set;} = "";
        public string[]? Data {get; set;}
    }
}