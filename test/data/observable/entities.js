export const subEntitiesTests = { fooEntity:`{
  "entities": [{"rel": ["foo"], "href": "www.abc.com"}],
  "links": [{
	"rel": ["self"],
	"href": "http://example.com"
  }],
  "href": "hello"
}`,
barEntity: `{
  "entities": [{"rel": ["bar"], "href": "www.abc.com"}],
  "links": [{
	"rel": ["self"],
	"href": "http://example.com"
  }],
  "href": "hello"
}`,
multipleSubEntities: `{
	"entities": [{"rel": ["foo"], "href": "www.def.com"},{"rel": ["foo"], "href": "www.xyz.com"}],
	"links": [{
	  "rel": ["self"],
	  "href": "http://example.com"
	}],
	"href": "hello"
  }`
};

export const linkTests = { fooRel: `{
	"links": [{
	  "rel": ["foo"],
	  "href": "http://example.com"
	}]
  }`, barRel: `{
	"links": [{
	  "rel": ["bar"],
	  "href": "http://example.com"
	}]
  }`
};

export const subEntityTests = { entityWithHref: `{
	"entities": [{
        "rel": ["foo"],
        "links": [{
            "rel": ["self"],
            "href": "www.subentity.com"
		}],
		"href": "www.foo.com"
    }]
  }`, entityWithoutHref:`{
	"entities": [{
        "rel": ["foo"],
        "links": [{
            "rel": ["self"],
            "href": "www.subentity.com"
		}]
    }]
  }`, barEntity: `{
	"entities": [{
        "rel": ["bar"],
        "links": [{
            "rel": ["self"],
            "href": "www.subentity.com"
		}]
    }]
  }`
};
