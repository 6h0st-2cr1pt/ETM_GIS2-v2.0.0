import os
import requests
import json

# Supabase configuration
SUPABASE_URL = "https://ngurgmrocmspeaqddian.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ndXJnbXJvY21zcGVhcWRkaWFuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjYzNTg0NywiZXhwIjoyMDcyMjExODQ3fQ.X3v5sqcTSVmeFrHdISvTmJC2RN53AXnBnFg2MJVgwpA"

class SupabaseClient:
    """Custom Supabase client to avoid proxy issues"""
    
    def __init__(self, url, key):
        self.url = url
        self.key = key
        self.headers = {
            'apikey': key,
            'Authorization': f'Bearer {key}',
            'Content-Type': 'application/json'
        }
    
    def table(self, table_name):
        return SupabaseTable(self.url, self.headers, table_name)

class SupabaseTable:
    """Custom Supabase table client"""
    
    def __init__(self, url, headers, table_name):
        self.url = url
        self.headers = headers
        self.table_name = table_name
    
    def select(self, columns='*'):
        return SupabaseQuery(self.url, self.headers, self.table_name, 'select', columns)
    
    def delete(self):
        return SupabaseQuery(self.url, self.headers, self.table_name, 'delete')
    
    def eq(self, column, value):
        return SupabaseQuery(self.url, self.headers, self.table_name, 'eq', column, value)

class SupabaseQuery:
    """Custom Supabase query builder"""
    
    def __init__(self, url, headers, table_name, operation, *args):
        self.url = url
        self.headers = headers
        self.table_name = table_name
        self.operation = operation
        self.args = args
        self.filters = []
    
    def eq(self, column, value):
        self.filters.append(f"{column}=eq.{value}")
        return self
    
    def execute(self):
        """Execute the query"""
        try:
            if self.operation == 'select':
                columns = self.args[0] if self.args else '*'
                url = f"{self.url}/rest/v1/{self.table_name}"
                if columns != '*':
                    url += f"?select={columns}"
                
                # Add filters
                if self.filters:
                    filter_str = '&'.join(self.filters)
                    url += f"{'&' if '?' in url else '?'}{filter_str}"
                
                response = requests.get(url, headers=self.headers)
                response.raise_for_status()
                
                class Response:
                    def __init__(self, data):
                        self.data = data
                
                return Response(response.json())
            
            elif self.operation == 'delete':
                url = f"{self.url}/rest/v1/{self.table_name}"
                
                # Add filters
                if self.filters:
                    filter_str = '&'.join(self.filters)
                    url += f"?{filter_str}"
                
                response = requests.delete(url, headers=self.headers)
                response.raise_for_status()
                
                class Response:
                    def __init__(self, data):
                        self.data = data
                
                # Handle empty response from Supabase delete
                try:
                    json_data = response.json()
                except ValueError:
                    # If response is empty or not JSON, return empty list
                    json_data = []
                
                return Response(json_data)
                
        except Exception as e:
            print(f"Supabase query error: {str(e)}")
            raise e

def get_supabase_client():
    """Get Supabase client instance"""
    return SupabaseClient(SUPABASE_URL, SUPABASE_KEY)
