/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 * <p>
 * http://www.apache.org/licenses/LICENSE-2.0
 * <p>
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package ai.platon.pulsar.protocol.crowd;

import ai.platon.pulsar.crawl.protocol.Response;
import ai.platon.pulsar.crawl.protocol.http.AbstractHttpProtocol;
import ai.platon.pulsar.persist.WebPage;

import javax.annotation.Nonnull;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

public class ForwardingProtocol extends AbstractHttpProtocol {

    private Map<String, Response> cache = Collections.synchronizedMap(new HashMap<>());

    public ForwardingProtocol() {
    }

    @Override
    public void setResponse(@Nonnull Response response) {
        cache.put(response.getUrl(), response);
    }

    @Override
    protected Response getResponse(String url, WebPage page, boolean followRedirects) {
        return cache.remove(url);
    }
}
