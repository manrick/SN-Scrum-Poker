import '@servicenow/sdk/global'

declare global {
    namespace Now {
        namespace Internal {
            interface Keys extends KeysRegistry {
                explicit: {
                    bom_json: {
                        table: 'sys_module'
                        id: '5add7e704d43456bbf6377aa2bd92a04'
                    }
                    package_json: {
                        table: 'sys_module'
                        id: '34802f78ff0d4af2a577e024afe93942'
                    }
                    'scrum-master-page': {
                        table: 'sys_ui_page'
                        id: '7d75a1a79b5e41ea8581a23cff73cf04'
                    }
                    'scrum-user-page': {
                        table: 'sys_ui_page'
                        id: '24d33f7975d340938a3629cc55eef90f'
                    }
                    ScrumPokerAjax: {
                        table: 'sys_script_include'
                        id: '472ed1eb26094171ad5631937e50de3a'
                    }
                    'src_server_script-includes_scrum-poker-ajax_js': {
                        table: 'sys_module'
                        id: 'b5d0eeb4fad64b918883b47bdccc1d6b'
                    }
                    'x_250424_sn_scrum8/____insertStyle-7XR2_AQS': {
                        table: 'sys_ux_lib_asset'
                        id: 'dc6e9fa2ef1442a2b5444ada6baf9996'
                        deleted: true
                    }
                    'x_250424_sn_scrum8/____insertStyle-7XR2_AQS.js.map': {
                        table: 'sys_ux_lib_asset'
                        id: 'c69c87c8c62044648e4016b2e94a88b6'
                        deleted: true
                    }
                    'x_250424_sn_scrum8/____insertStyle-Dag9rpHz': {
                        table: 'sys_ux_lib_asset'
                        id: 'fabe90b749c54deea1d24ce865e98508'
                    }
                    'x_250424_sn_scrum8/____insertStyle-Dag9rpHz.js.map': {
                        table: 'sys_ux_lib_asset'
                        id: '26d6b078d6ce4f07a15483a3c652d0c7'
                    }
                    'x_250424_sn_scrum8/____insertStyle-DjWWheLu': {
                        table: 'sys_ux_lib_asset'
                        id: '9e9f5a932a1f4c0bb1ce6affba496fcf'
                        deleted: true
                    }
                    'x_250424_sn_scrum8/____insertStyle-DjWWheLu.js.map': {
                        table: 'sys_ux_lib_asset'
                        id: '82f6f796b3d741cab0474e1879b7da79'
                        deleted: true
                    }
                    'x_250424_sn_scrum8/scrum-master-main': {
                        table: 'sys_ux_lib_asset'
                        id: '520c898e8d0547b3be0025fe174fb7ce'
                    }
                    'x_250424_sn_scrum8/scrum-master-main.js.map': {
                        table: 'sys_ux_lib_asset'
                        id: 'c4573d10581946d6a599a0103c26bd3b'
                    }
                    'x_250424_sn_scrum8/scrum-user-main': {
                        table: 'sys_ux_lib_asset'
                        id: '9b3d259d5e0c46d9b016556a3cc2b399'
                    }
                    'x_250424_sn_scrum8/scrum-user-main.js.map': {
                        table: 'sys_ux_lib_asset'
                        id: '34f559e2c4004bc6aeb97f164126fac7'
                    }
                }
                composite: [
                    {
                        table: 'sys_choice'
                        id: '006b212b3b844850a7c5bbbaf9b0cc37'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_vote'
                            element: 'vote_value'
                            value: '5'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '00c4363e85cb4dbbaeee8351862eeca4'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_vote'
                            element: 'voter'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '01ff41238e3e476dbed1157cbc9260ee'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_session'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '028d9b7144e34d969c90713e34eba54f'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_session'
                            element: 'state'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '0783ce6b796944f1bc3815e171d675a5'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_session'
                            element: 'voting_duration'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '07e977ab63cf4b249dba22169c67d491'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_vote'
                            element: 'story'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0f6eb6d6bb8f441e9931dd5c71f87621'
                        key: {
                            name: 'x_250424_sn_scrum8_session_participant'
                            element: 'user'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '118abf47261441f98fcfb410afac2537'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_vote'
                            element: 'vote_value'
                            value: '13'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '1313e37c69cd433ab6462b8ef1f66aee'
                        key: {
                            name: 'x_250424_sn_scrum8_session_participant'
                            element: 'is_online'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '27bd9d76942e4cf3a02f57b4f6ca04d0'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_session'
                            element: 'voting_duration'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '28b13ce9087e41d8b18b1200f20b3bfe'
                        key: {
                            name: 'x_250424_sn_scrum8_session_participant'
                            element: 'last_activity'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '352e83d9318c452c864c19865227a20b'
                        key: {
                            name: 'x_250424_sn_scrum8_session_participant'
                            element: 'user'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '3588fc6ec2cc4e9ab9e427f5c38b37fe'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_session'
                            element: 'scrum_master'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '383d485b46fa41cfa7476a2a14cfdf9d'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_session'
                            element: 'created_on'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '3857946aa491454c85341829d92e0842'
                        key: {
                            name: 'x_250424_sn_scrum8_session_participant'
                            element: 'joined_at'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '3e186140998e4b0dbd4a76c44a69390c'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_session'
                            element: 'state'
                            value: 'revealing'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '4e0cb66a0d664d0e8686cbb8bcb7c8a0'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_session'
                            element: 'voting_started_at'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '4eb09cf746a3473c8859a2803dffedbf'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_session'
                            element: 'state'
                            value: 'completed'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '4eba3d663b3044449e411626b1c4f132'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_vote'
                            element: 'session'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '51978a8516d742f1af9eb9caf5854474'
                        key: {
                            name: 'x_250424_sn_scrum8_session_participant'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '532061e841ba4ea1b3126b2f06d5c694'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_session'
                            element: 'scrum_master'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '53bcfb25b31f474c99d32d2c6fdf0c47'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_session'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '56b863680afd48c8bcd757cf0192f044'
                        key: {
                            name: 'x_250424_sn_scrum8_session_participant'
                            element: 'is_online'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '5b4a444959b94195ab4269334e3ac47b'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_session'
                            element: 'created_on'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '5ff92180117f450088dec84dad26427a'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_session'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '6186e3967feb4811bb33bd8b3994539d'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_session'
                            element: 'session_code'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '61e45ba922914a028905c054c63af1f5'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_session'
                            element: 'state'
                            value: 'active'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '678ee9e858cd446881ff3b1a8704164f'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_vote'
                            element: 'vote_value'
                            value: '1'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '68205b8da26c442f882796e6496e78e4'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_session'
                            element: 'current_story'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '6822a19a9b3c4e2aad1d7784faf466b0'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_vote'
                            element: 'story'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '7cb751136a6d441687bb1989eb886447'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_session'
                            element: 'session_code'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '81346917dc194443807c5f5a473b0a94'
                        key: {
                            name: 'x_250424_sn_scrum8_session_participant'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '85da2da5b49b4b0481edbd4d1589598d'
                        key: {
                            name: 'x_250424_sn_scrum8_session_participant'
                            element: 'last_activity'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '88ddf6e2b4c5495fbcb936cf30f39c46'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_session'
                            element: 'voting_started_at'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '929123c9229846ce8014b246faac330a'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_vote'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '95711f81c65c4751b38c79d541010971'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_session'
                            element: 'session_name'
                        }
                    },
                    {
                        table: 'sys_user_role'
                        id: '9812e555095e460c97a0165c88141e32'
                        key: {
                            name: 'x_250424_sn_scrum8.scrum_poker_scrum_user'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '989d9ccbb8a847d7aa47c2f46a9aa6cb'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_session'
                            element: 'current_story'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '99809be4a3314f5ab442b62bd82daade'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_vote'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'a1db6d5565aa423bac5df33163a0b988'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_session'
                            element: 'state'
                            value: 'waiting'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'a549c616fe0448128efb9e4d218d3fa9'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_session'
                            element: 'state'
                            value: 'paused'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'a9d589989a2e4f5b8a16cdce8815f6d7'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_vote'
                            element: 'vote_value'
                            value: 'unknown'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'aa73fa9dc34f4a29b41eefac95b79018'
                        key: {
                            name: 'x_250424_sn_scrum8_session_participant'
                            element: 'session'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ac2faeac4cf441f89ab94651c2091a8b'
                        key: {
                            name: 'x_250424_sn_scrum8_session_participant'
                            element: 'session'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b2d4a8d6216d45beaeb0a83ad362672b'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_vote'
                            element: 'vote_value'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b5b2c39ad2ef442b89d40d1bca4790fa'
                        key: {
                            name: 'x_250424_sn_scrum8_session_participant'
                            element: 'joined_at'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c1daca99e42d437abbc970b0286caebf'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_vote'
                            element: 'vote_value'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c265f88d4e1c4641be276270884aabfc'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_session'
                            element: 'is_active'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: 'c575f7be69d24cfdae009f9b3e261a63'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_session'
                        }
                    },
                    {
                        table: 'sys_user_role'
                        id: 'c63a4a3ef80d44309fc15fd6b6161a19'
                        key: {
                            name: 'x_250424_sn_scrum8.scrum_poker_scrum_master'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'cad6648f751246509b02e678fcf95183'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_vote'
                            element: 'voted_at'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'cf32bb8559ec4290ade2d82f0b9ff67b'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_vote'
                            element: 'vote_value'
                            value: '2'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd14536f22c3e4d74afd3fc7b5fa1e39e'
                        key: {
                            name: 'x_250424_sn_scrum8_session_participant'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'd199101e39d6417f8fc85f20b623c899'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_vote'
                            element: 'vote_value'
                            value: '8'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'd599cb4eb93144d9800a3223bb3926e6'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_vote'
                            element: 'voter'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd84709b960104be3b9b59b89539cbcaa'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_session'
                            element: 'session_name'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e1d7c7ad75a4410b808cffccd9ef5877'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_session'
                            element: 'is_active'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e2273c2e1cc74a4c98370f0701d84d48'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_session'
                            element: 'state'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e30dea8ed9744086a5e7191a762bd9df'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_vote'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'e6450e1204a64872adce1a338f11a5e1'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_vote'
                            element: 'vote_value'
                            value: '3'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ea908fc5c200409187bffd625344a6ed'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_vote'
                            element: 'voted_at'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: 'ed7f701e092e478691abfd2a38d7ee38'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_vote'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f06d72587d4445ab83186b347e759362'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_vote'
                            element: 'session'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f59b230a011047c981dea9537354acd7'
                        key: {
                            name: 'x_250424_sn_scrum8_poker_vote'
                            element: 'vote_value'
                            value: '20'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: 'f670e1da68144caeb51bfa6e6b66f06c'
                        key: {
                            name: 'x_250424_sn_scrum8_session_participant'
                        }
                    },
                ]
            }
        }
    }
}
