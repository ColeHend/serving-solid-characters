using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SolidCharacters
{
    using System;
using System.Collections;
using System.Collections.Generic;
using System.Reflection;
using System.Runtime.CompilerServices;
using System.Text;

public static class ObjectReflector
{
    public static string ObjectToString(object obj)
    {
        var visited = new HashSet<object>(new ReferenceEqualityComparer());
        return ObjectToString(obj, visited);
    }

    private static string ObjectToString(object obj, HashSet<object> visited)
    {
        if (obj == null)
        {
            return "null";
        }

        Type type = obj.GetType();

        if (IsPrimitive(type))
        {
            return obj.ToString();
        }

        if (visited.Contains(obj))
        {
            return "[Circular Reference]";
        }
        visited.Add(obj);

        if (obj is IEnumerable enumerable && !(obj is string))
        {
            StringBuilder sb = new StringBuilder();
            sb.Append("[");
            bool first = true;
            foreach (var item in enumerable)
            {
                if (!first)
                {
                    sb.Append(", ");
                }
                sb.Append(ObjectToString(item, visited));
                first = false;
            }
            sb.Append("]");
            return sb.ToString();
        }
        else
        {
            // Handle objects with properties
            StringBuilder sb = new StringBuilder();
            sb.Append("{");
            PropertyInfo[] properties = type.GetProperties();
            bool first = true;
            foreach (var prop in properties)
            {
                if (!first)
                {
                    sb.Append(", ");
                }
                sb.Append(prop.Name);
                sb.Append(": ");
                object propValue = prop.GetValue(obj, null);
                sb.Append(ObjectToString(propValue, visited));
                first = false;
            }
            sb.Append("}");
            return sb.ToString();
        }
    }

    private static bool IsPrimitive(Type type)
    {
        if (type.IsPrimitive || type == typeof(string) || type == typeof(decimal))
        {
            return true;
        }
        return false;
    }

    // Custom equality comparer to compare object references
    private class ReferenceEqualityComparer : IEqualityComparer<object>
    {
        bool IEqualityComparer<object>.Equals(object x, object y)
        {
            return ReferenceEquals(x, y);
        }

        int IEqualityComparer<object>.GetHashCode(object obj)
        {
            if (obj == null)
                return 0;
            return RuntimeHelpers.GetHashCode(obj);
        }
    }
}

}