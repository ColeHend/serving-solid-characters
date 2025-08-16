using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace sharpAngleTemplate.Repositories
{
    public static class ToolRepository
    {

        public static string SendAsJson(this Object dataToSend,string keyName = "data")
        {
            var token = JsonConvert.SerializeObject(dataToSend);
            var jsonString = $"{{ \"{keyName}\": {token} }}";
    
            return jsonString;
        }
        public static T DeepCopy<T>(this T tocopy)
        { 
            return JsonConvert.DeserializeObject<T>(JsonConvert.SerializeObject(tocopy))!;
        }

        public static string Stringify(this object toString)
        {
            return JsonConvert.SerializeObject(toString);
        }

        public static T? Parse<T>(this string toObject)
        {
            return JsonConvert.DeserializeObject<T>(toObject);
        }
    }
}