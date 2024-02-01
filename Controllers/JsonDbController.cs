using Microsoft.AspNetCore.Mvc;
using sharpAngleTemplate.models;
using Newtonsoft.Json;
using Microsoft.OpenApi.Any;
using sharpAngleTemplate.tools;
using sharpAngleTemplate.Repositories;
using sharpAngleTemplate.CustomActionFilters;
using Microsoft.AspNetCore.Authorization;

namespace sharpAngleTemplate.Controllers
{
    [ApiController]
    [Route("api/[controller]/[action]")]
    public class JsonDbController : ControllerBase
    {
        private IDbJsonService _db;
        public JsonDbController(IDbJsonService DbJsonService)
        {
            _db = DbJsonService;
        }
        // ---------------- Endpoints ------------------
        [HttpPost]
        [Authorize(Roles = "Guest")]
        public IActionResult GetCollection([FromBody] GetCollectionReq request){
            Console.WriteLine("GetCollection: ",request.Stringify());
            var CollectionName = request.CollectionName;
            var collection = _db.GetCollectionFromDB(CollectionName);
            if (collection != null)
            {
                return Ok(JsonConvert.SerializeObject(collection));
            } 
            return BadRequest();

        }

        [HttpPost]
        public IActionResult CreateCollection([FromBody] CreateCollectionReq request)
        {
            Console.WriteLine("CreateCollection",request.Stringify());

            var CollectionName = request.CollectionName;
            var Data = request.Data;

            int index = _db.GetCollectionIndex(CollectionName);
            var collection = _db.GetCollectionFromDB(CollectionName);

            if (collection != null && Data != null && index > -1)
            {
                _db.ReplaceCollectionAllData(CollectionName, Data);
            } 
            else if (CollectionName != null && Data != null && index == -1)
            {
                _db.CreateCollectionInDB(CollectionName, Data);
                collection = _db.GetCollectionFromDB(CollectionName);

            }
            _db.SyncDatabaseJSON();
            if (collection != null)
            {
                return new ContentResult() {Content = JsonConvert.SerializeObject(collection), StatusCode = 200 };
            }
            else
            {
                return new ContentResult() {StatusCode = 500};
            }
        }

        [HttpPost]
        public IActionResult AddData([FromBody] AddDataReq request)
        {
            Console.WriteLine("AddData",request.Stringify());
            var CollectionName = request.CollectionName;
            var Data = request.Data;

            var index = _db.GetCollectionIndex(CollectionName);
            if (index >= 0 && Data != null)
            {
                _db.AddToDataCollection(CollectionName, Data);
            }
            _db.SyncDatabaseJSON();
            return new ContentResult(){StatusCode=200};
        }

        [HttpPost]
        public IActionResult AddMassData([FromBody] AddMassDataReq request)
        {
            Console.WriteLine("AddMassData",request.Stringify());
            var CollectionName = request.CollectionName;
            var Data = request.Data;

            var index = _db.GetCollectionIndex(CollectionName);
            if (index >= 0 && Data != null)
            {
                foreach (var item in Data)
                {
                    _db.AddToDataCollection(CollectionName, item);
                }
            }
            _db.SyncDatabaseJSON();
            return new ContentResult(){StatusCode=200};
        }
    }

    public class GetCollectionReq 
    {
        public string CollectionName {get;set;}
    }
    public class CreateCollectionReq
    {
        public string CollectionName {get;set;}
        public string[] Data {get;set;}
    }
    public class AddDataReq
    {
        public string CollectionName {get;set;}
        public string Data {get;set;}
    }
    public class AddMassDataReq
    {
        public string CollectionName {get;set;}
        public string[] Data {get;set;}
    }
}