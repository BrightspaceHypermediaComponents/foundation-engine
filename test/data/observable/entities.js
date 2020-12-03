export const testSubEntities = [`{
  "entities": [{"rel": ["foo"], "href": "www.abc.com"}],
  "links": [{
	"rel": ["self"],
	"href": "http://example.com"
  }],
  "href": "hello"
}`,
`{
  "entities": [{"rel": ["bar"], "href": "www.abc.com"}],
  "links": [{
	"rel": ["self"],
	"href": "http://example.com"
  }],
  "href": "hello"
}`,
`{
	"entities": [{"rel": ["foo"], "href": "www.def.com"},{"rel": ["foo"], "href": "www.xyz.com"}],
	"links": [{
	  "rel": ["self"],
	  "href": "http://example.com"
	}],
	"href": "hello"
  }`
];

export const testLinks = [`{
	"links": [{
	  "rel": ["foo"],
	  "href": "http://example.com"
	}]
  }`, `{
	"links": [{
	  "rel": ["bar"],
	  "href": "http://example.com"
	}]
  }`
];

export const testSubEntitys = [`{
	"entities": [{
        "rel": ["foo"],
        "links": [{
            "rel": ["self"],
            "href": "www.subentity.com"
		}],
		"href": "www.foo.com"
    }]
  }`, `{
	"entities": [{
        "rel": ["foo"],
        "links": [{
            "rel": ["self"],
            "href": "www.subentity.com"
		}]
    }]
  }`, `{
	"entities": [{
        "rel": ["bar"],
        "links": [{
            "rel": ["self"],
            "href": "www.subentity.com"
		}]
    }]
  }`
];
